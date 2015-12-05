'use strict';
const electron = require('electron');
const app = electron.app;
const Menu = electron.Menu;
const Tray = electron.Tray;
const AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
const P = require('bluebird');
const _ = require('lodash');
const winston = require('winston');
const Template = require('./template');
var Resource = new require('./resource')();

var logger = new winston.Logger({
	level: 'info',
	transports: [
		new (winston.transports.Console)(),
		new (winston.transports.File)({ filename: 'bellerophon.log' })
	]
});

var log = function(msg, level, from) {
	if(!level) {
		level = 'info';
	}
	if(!from) {
		from = 'SERVER:'
	}
	logger.log(level, from, msg);
};

// prevent window being garbage collected
let mainWindow;
let templateWindow;

var ec2 = P.promisifyAll(new AWS.EC2());
var ASG = P.promisifyAll(new AWS.AutoScaling());
log('Initializing Main');

const ipcMain = require('electron').ipcMain;

var template = new Template();

/*
 var template = {
 "AWSTemplateFormatVersion" : "2010-09-09",
 "Parameters" : {},
 "Resources" : {},
 };
 */

var availableResources = {
	AutoScaling: {
	 AutoScalingGroup: {},
	 LaunchConfiguration: {},
	 LifecycleHook: {},
	 ScalingPolicy: {},
	 ScheduledAction: {}
	 },
	EC2: {
		CustomerGateway : {},
		DHCPOptions : {},
		EIP : {},
		EIPAssociation : {},
		Instance : {},
		InternetGateway : {},
		NetworkAcl : {},
		NetworkAclEntry : {},
		NetworkInterface : {},
		NetworkInterfaceAttachment : {},
		PlacementGroup : {},
		Route : {},
		RouteTable : {},

		SecurityGroup : {},
		/*
		 SecurityGroupEgress : {},
		 SecurityGroupIngress : {},
		 SpotFleet : {},
		 */
		Subnet : {},
		/*
		 SubnetNetworkAclAssociation : {},
		 SubnetRouteTableAssociation : {},
		 Volume : {},
		 VolumeAttachment : {},
		 */
		VPC : {}
		/*
		 VPCDHCPOptionsAssociation : {},
		 VPCEndpoint : {},
		 VPCGatewayAttachment : {},
		 VPCPeeringConnection : {},
		 VPNConnection : {},
		 VPNConnectionRoute : {},
		 VPNGateway : {},
		 VPNGatewayRoutePropagation : {}
		 */
	}
};

function populateBlock(block, body) {
	block.Properties = _.reduce(block.Properties, function(result, n, key) {
		result[key] = body[key];
		return result;
	}, {});
	return block;
}

function recursiveReplace(object, newPattern, oldPattern) {
	_.forIn(object, function (val, key) {
		//console.log('Recursive Run');
		if(val === oldPattern) {
			//console.log('Replacing at ' + val);
			object[key] = newPattern
		}
		//console.log(key);
		if (_.isArray(val)) {
			//console.log('Recursing on an array ' + val);
			val.forEach(function(el) {
				if (_.isObject(el)) {
					recursiveReplace(el, newPattern, oldPattern);
				}
			});
		}
		if (_.isObject(object[key])) {
			//console.log('Recursing on an object ' + key);
			recursiveReplace(object[key], newPattern, oldPattern);
		}
	});
}

function addResource(resource) {
	console.log('block');
	console.log('Recursive rename');
	recursiveReplace(template.body.Resources, '{ Ref: ' + resource.name + ' }', resource.id);
	var newResource = populateBlock(resource.block, resource.body);
	_.each(template.body.Resources, function(val, key) {
		console.log('Checking ' + key);
		console.log('Match: ' + key.replace('-resource',''));
		recursiveReplace(newResource, '{ Ref: ' + key + ' }', key.replace('-resource',''))
	});
	template.body.Resources[resource.name] = newResource;
	if(templateWindow) {
		templateWindow.webContents.send('update-template', template.body);
	}
}

function removeResource(resource) {
	console.log('block');
	console.log(resource.block);
	recursiveReplace(template.body.Resources, resource.id, '{ Ref: ' + resource.name + ' }');
	delete template.body.Resources[resource.name];
	if(templateWindow) {
		templateWindow.webContents.send('update-template', template.body);
	}
}

function addParam(resource, pKey) {
	if(template.body.Resources[resource.name]) {
		if(template.body.Resources[resource.name].Properties[pKey]) {
			var oldVal = template.body.Resources[resource.name].Properties[pKey];
			var paramName = resource.name + '-' + pKey + '-param';
			template.body.Resources[resource.name].Properties[pKey] = '{ Ref: ' + paramName + ' }';
			template.body.Parameters[paramName] = {
				"Type" : "String",
				"Default" : oldVal
			}
		}
	}
	if(templateWindow) {
		templateWindow.webContents.send('update-template', template.body);
	}
}

function removeParam(resource, pKey) {
	if(template.body.Resources[resource.name]) {
		if(template.body.Resources[resource.name].Properties[pKey]) {
			var paramName = resource.name + '-' + pKey + '-param';
			template.body.Resources[resource.name].Properties[pKey] = template.body.Parameters[paramName].Default;
			delete template.body.Parameters[paramName];
		}
	}
	if(templateWindow) {
		templateWindow.webContents.send('update-template', template.body);
	}
}


ipcMain.on('update-resources', function(event, res) {
	log('Got update-resources request');
	var params = {};
	switch(res) {
		case "AWS_AutoScaling_AutoScalingGroup":
			params = {
				call: ASG.describeAutoScalingGroupsAsync({}),
				resBlock: 'AutoScalingGroups',
				constructor: Resource.AWS_AutoScaling_AutoScalingGroup,
				name: "AutoScalingGroupName",
				targetBlock: availableResources.AutoScaling.AutoScalingGroup
			};
			break;
		/*case "AWS__AUTOSCALING_LaunchConfiguration":
			params = {
				call: ASG.describeAsync({}),
				resBlock: '',
				constructor: Resource.AWS_AUTOSCALING_,
				name: "",
				targetBlock: availableResources._AUTOSCALING.
			};
			break;
		case "AWS_AUTOSCALING_LifecycleHook":
			params = {
				call: ASG.describeAsync({}),
				resBlock: '',
				constructor: Resource.AWS_AUTOSCALING_,
				name: "",
				targetBlock: availableResources._AUTOSCALING.
			};
			break;
		case "AWS_AUTOSCALING_ScalingPolicy":
			params = {
				call: ASG.describeAsync({}),
				resBlock: '',
				constructor: Resource.AWS_AUTOSCALING_,
				name: "",
				targetBlock: availableResources._AUTOSCALING.
			};
			break;
		case "AWS_AUTOSCALING_ScheduledAction":
			params = {
				call: ASG.describeAsync({}),
				resBlock: '',
				constructor: Resource.AWS_AUTOSCALING_,
				name: "",
				targetBlock: availableResources._AUTOSCALING.
			};
			break;
		*/
		case "AWS_EC2_VPC":
			params = {
				call: ec2.describeVpcsAsync({}),
				resBlock: 'Vpcs',
				constructor: Resource.AWS_EC2_VPC,
				name: "VpcId",
				targetBlock: availableResources.EC2.VPC
			};
			break;
		case "AWS_EC2_SUBNET":
			params = {
				call: ec2.describeSubnetsAsync({}),
				resBlock: 'Subnets',
				constructor: Resource.AWS_EC2_SUBNET,
				name: "SubnetId",
				targetBlock: availableResources.EC2.Subnet
			};
			break;
		case "AWS_EC2_SECURITYGROUP":
			params = {
				call: ec2.describeSecurityGroupsAsync({}),
				resBlock: 'SecurityGroups',
				constructor: Resource.AWS_EC2_SECURITYGROUP,
				name: "GroupId",
				targetBlock: availableResources.EC2.SecurityGroup
			};
			break;

		/*
		 AWS_EC2_CustomerGateway
		 AWS_EC2_DHCPOptions
		 AWS_EC2_EIP
		 AWS_EC2_EIPAssociation
		 AWS_EC2_Instance
		 AWS_EC2_InternetGateway
		 AWS_EC2_NetworkAcl
		 AWS_EC2_NetworkAclEntry
		 AWS_EC2_NetworkInterface
		 AWS_EC2_NetworkInterfaceAttachment
		 AWS_EC2_PlacementGroup
		 AWS_EC2_Route
		 AWS_EC2_RouteTable
		 AWS_EC2_SecurityGroupEgress
		 AWS_EC2_SecurityGroupIngress
		 AWS_EC2_SpotFleet
		 AWS_EC2_SubnetNetworkAclAssociation
		 AWS_EC2_SubnetRouteTableAssociation
		 AWS_EC2_Volume
		 AWS_EC2_VolumeAttachment
		 AWS_EC2_VPCDHCPOptionsAssociation
		 AWS_EC2_VPCEndpoint
		 AWS_EC2_VPCGatewayAttachment
		 AWS_EC2_VPCPeeringConnection
		 AWS_EC2_VPNConnection
		 AWS_EC2_VPNConnectionRoute
		 AWS_EC2_VPNGateway
		 AWS_EC2_VPNGatewayRoutePropagation
		 */
	};
	params
		.call
		.then(function(data) {
			log('Sending data');
			//log(Resource);
			log(res);
			log(data);
			log(Resource[res].blockGroup);

			data[params.resBlock].forEach(function(r) {
				var newResource = new params.constructor(r[params.name], r);
				params.targetBlock[newResource.id] = newResource;
			});
			event.sender.send('update-resources', availableResources);
		})
		.catch(function(e) {
			console.log(e);
		});
});

ipcMain.on('send-log', function(event, arg) {
	console.log('Received log request');
	log(arg.msg, arg.level, arg.from);
});

ipcMain.on('get-template-request', function(event, arg) {
	console.log('Received get template request');
	event.sender.send('get-template-reply', template.body);
});

ipcMain.on('open-template-window', function(event) {
	console.log('Received request to open template window.');
	if(!templateWindow) {
		templateWindow = createTemplateWindow();
	}
});

ipcMain.on('toggle-param', function(event, res) {
	log('Toggling param in template');
	if(availableResources[res.key][res.subKey][res.resource.id].templateParams[res.pKey]) {
		availableResources[res.key][res.subKey][res.resource.id].templateParams[res.pKey] = false;
		removeParam(res.resource, res.pKey);
	} else {
		availableResources[res.key][res.subKey][res.resource.id].templateParams[res.pKey] = true;
		addParam(res.resource, res.pKey);
	}
	log('avail');
	log(availableResources[res.key][res.subKey][res.resource.id].templateParams);
	//addResource(res.resource);
	event.sender.send('update-resources', availableResources);
});

ipcMain.on('add-to-template-request', function(event, res) {
	log('Adding resource to template');
	availableResources[res.key][res.subKey][res.resource.id].inTemplate = true;
	log('avail');
	log(availableResources);
	addResource(res.resource);
	event.sender.send('update-resources', availableResources);
});

ipcMain.on('remove-from-template-request', function(event, res) {
	console.log('Removed resource from template');
	availableResources[res.key][res.subKey][res.resource.id].inTemplate = false;
	removeResource(res.resource);
	event.sender.send('update-resources', availableResources);
});

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

function onMainClosed() {
	mainWindow = null;
}

function onTemplateClosed() {
	templateWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 700,
		height: 800,
		minWidth: 600,
		minHeight: 500,
		title: 'Bellerophon'
	});

	win.loadURL(`file://${__dirname}/ui/index.html`);
	win.on('closed', onMainClosed, 'main');
	return win;
}

function createTemplateWindow() {
	const win = new electron.BrowserWindow({
		width: 600,
		height: 800,
		title: 'Bellerophon Template'
	});

	win.loadURL(`file://${__dirname}/template/index.html`);
	win.on('closed', onTemplateClosed, 'template');
	return win;
}

app.on('window-all-closed', () => {
	app.quit();
});

app.on('activate-with-no-open-windows', () => {
	console.log('activate-with-no-open-windows');
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

var appIcon = null;
var menu = null;

app.on('ready', () => {
	console.log('Ready');

	var menuTemplate = [
		{
			label: 'View',
			submenu: [
				{
					label: 'Reload',
					accelerator: 'CmdOrCtrl+R',
					click: function(item, focusedWindow) {
						if (focusedWindow)
							focusedWindow.reload();
					}
				},
				{
					label: 'Toggle Full Screen',
					accelerator: (function() {
						if (process.platform == 'darwin')
							return 'Ctrl+Command+F';
						else
							return 'F11';
					})(),
					click: function(item, focusedWindow) {
						if (focusedWindow)
							focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
					}
				},
				{
					label: 'Toggle Developer Tools',
					accelerator: (function() {
						if (process.platform == 'darwin')
							return 'Alt+Command+I';
						else
							return 'Ctrl+Shift+I';
					})(),
					click: function(item, focusedWindow) {
						if (focusedWindow)
							focusedWindow.toggleDevTools();
					}
				},
			]
		},
		{
			label: 'Window',
			role: 'window',
			submenu: [
				{
					label: 'Minimize',
					accelerator: 'CmdOrCtrl+M',
					role: 'minimize'
				},
				{
					label: 'Close',
					accelerator: 'CmdOrCtrl+W',
					role: 'close'
				},
			]
		},
		{
			label: 'Help',
			role: 'help',
			submenu: [
				{
					label: 'Learn More',
					click: function() { require('electron').shell.openExternal('http://github.com/arminhammer/bellerophon') }
				},
			]
		},
	];

	if (process.platform == 'darwin') {
		var name = require('electron').app.getName();
		menuTemplate.unshift({
			label: name,
			submenu: [
				{
					label: 'About ' + name,
					role: 'about'
				},
				{
					type: 'separator'
				},
				{
					label: 'Show Template',
					accelerator: 'Command + T',
					click: function() {
						if(!templateWindow) {
							templateWindow = createTemplateWindow();
						}
					}
				},
				{
					label: 'Save Template',
					accelerator: 'Command + S',
					role: 'hide'
				},
				{
					type: 'separator'
				},
				{
					label: 'Quit',
					accelerator: 'Command+Q',
					click: function() { app.quit(); }
				},
			]
		});
		menuTemplate[3].submenu.push(
			{
				type: 'separator'
			},
			{
				label: 'Bring All to Front',
				role: 'front'
			}
		);
	}

	menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);

	mainWindow = createMainWindow();
});
