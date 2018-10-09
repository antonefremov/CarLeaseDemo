sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("car.lease.CarLeaseDemo.controller.View1", {

		accessToken: null,

		serviceKey: {
			// "channelId": "dev627077c8-e9a6-4ffb-b368-01ef0c303dd5carlease.vehicle",
			"serviceUrl": "https://hyperledger-fabric.cfapps.eu10.hana.ondemand.com/api/v1",
			"chaincodePath": "/chaincodes/627077c8-e9a6-4ffb-b368-01ef0c303dd5-com-sap-blockchain-carlease/latest/",
			"vehiclesPath": "vehicles/",
			"ownersPath": "owners/",
			"vehicleOwnerPath": "vehicles/owner/v",
			"oAuth": {
				"clientId": "sb-34d0015d-0a99-496a-8fcd-e74ea546e694!b5485|na-420adfc9-f96e-4090-a650-0386988b67e0!b1836",
				"clientSecret": "IUTA1zPBP0ZO2m7k75nqDvAIo6w=",
				"url": "https://i300455trial.authentication.eu10.hana.ondemand.com"
			}
		},

		onInit: function () {
			var oNewVehicleModel = new JSONModel({}),
				oExistingOwnersModel = new JSONModel({}),
				oSelectedNewOwnerModel = new JSONModel({}),
				oSelectedVehicleModel = new JSONModel({}),
				that = this;
			this.getView().setModel(oNewVehicleModel, "newVehicleModel");
			this.getView().setModel(oExistingOwnersModel, "existingOwnersModel");
			this.getView().setModel(oSelectedNewOwnerModel, "selectedNewOwnerModel");
			this.getView().setModel(oSelectedVehicleModel, "selectedVehicleModel");
			this.getToken(this.serviceKey.oAuth.url + "/oauth/token?grant_type=client_credentials",
					this.serviceKey.oAuth.clientId,
					this.serviceKey.oAuth.clientSecret)
				.then(
					function (result) {
						var formData = new FormData(),
							xhr = new XMLHttpRequest(),
							serviceUrl = that.serviceKey.serviceUrl + that.serviceKey.chaincodePath + that.serviceKey.vehiclesPath;
						that.accessToken = result;
						xhr.open("GET", serviceUrl);
						xhr.setRequestHeader("Authorization", "Bearer " + result);
						xhr.withCredentials = true; // CORS
						xhr.onload = function () {
							if (xhr.status === 200) {
								var data = JSON.parse(xhr.response),
									oModel = new JSONModel(data);
								that.getView().byId("CarLeaseWorklistTable").setModel(oModel);
							}
						};
						xhr.send(formData);
					}
				);
		},

		getToken: function (url, clientId, clientSecret, serviceUrl) {
			return new Promise(function (resolve, reject) {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", url, true);
				xhr.setRequestHeader("Authorization", "Basic " + btoa(clientId + ":" + clientSecret));
				xhr.onload = function () {
					if (xhr.status === 200) {
						var authData = JSON.parse(xhr.response);
						resolve(authData.access_token, serviceUrl);
					}
					reject();
				};
				xhr.send();
			});
		},

		onNewVehicleBtnPress: function () {
			var sFragId;
			if (!this._newVehicleDialog) {
				sFragId = this.createId("idNewVehicleDialogFrag");
				this._newVehicleDialog = sap.ui.xmlfragment(sFragId, "car.lease.CarLeaseDemo.fragments.NewVehicle", this);
				this.getView().addDependent(this._newVehicleDialog);
			}
			//this._newVehicleDialog.setModel(this.getView().getModel("DeferCodeModel"));
			this._newVehicleDialog.open();
		},

		onNewVehicleDialogCancel: function () {
			if (this._newVehicleDialog) {
				this._newVehicleDialog.close();
			}
		},

		onNewVehicleDialogOK: function () {
			var oModel = this.getView().getModel("newVehicleModel"),
				data = oModel.getData(),
				serviceUrl = this.serviceKey.serviceUrl + this.serviceKey.chaincodePath + this.serviceKey.vehiclesPath + data.v5cID,
				xhr = new XMLHttpRequest(),
				oSelectedOwnerModel = this.getView().getModel("selectedNewOwnerModel"),
				that = this;

			var selectedOwnerData = oSelectedOwnerModel.getData();
			data.owner = {
				"id": selectedOwnerData.id,
				"username": selectedOwnerData.username,
				"company": selectedOwnerData.company
			}

			var oNewVehicle = {
				"v5cID": data.v5cID,
				"make": data.make,
				"model": data.model,
				"reg": data.reg,
				"colour": data.colour,
				"owner": data.owner
			};
			
			var dataToSend = {
				"id": data.v5cID,
				"text": JSON.stringify(oNewVehicle)
			}

			xhr.open("POST", serviceUrl);
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.setRequestHeader("Authorization", "Bearer " + this.accessToken);
			xhr.onload = function () {
				if (xhr.status === 200) {
					MessageToast.show("New vehicle has been created");
					that.onNewVehicleDialogCancel();
					oModel.setProperty("/", "");
					that.refreshWorklist();
				} else {
					MessageToast.show("Calling the API failed");
				}
			};
			xhr.send(JSON.stringify(dataToSend));
		},

		getExistingOwners: function () {
			var formData = new FormData(),
				xhr = new XMLHttpRequest(),
				serviceUrl = this.serviceKey.serviceUrl + this.serviceKey.chaincodePath + this.serviceKey.ownersPath,
				that = this;
			xhr.open("GET", serviceUrl);
			xhr.setRequestHeader("Authorization", "Bearer " + this.accessToken);
			xhr.withCredentials = true; // CORS
			xhr.onload = function () {
				if (xhr.status === 200) {
					var data = JSON.parse(xhr.response),
						oModel = that.getView().getModel("existingOwnersModel");
					oModel.setData(data);
				}
			};
			xhr.send(formData);
		},

		refreshWorklist: function () {
			var formData = new FormData(),
				xhr = new XMLHttpRequest(),
				serviceUrl = this.serviceKey.serviceUrl + this.serviceKey.chaincodePath + this.serviceKey.vehiclesPath,
				that = this;
			xhr.open("GET", serviceUrl);
			xhr.setRequestHeader("Authorization", "Bearer " + this.accessToken);
			xhr.withCredentials = true; // CORS
			xhr.onload = function () {
				if (xhr.status === 200) {
					var data = JSON.parse(xhr.response),
						oModel = new JSONModel(data);
					that.getView().byId("CarLeaseWorklistTable").setModel(oModel);
				}
			};
			xhr.send(formData);
		},
		
		onOwnerSelected: function(oEvent) {
			var oSelect = oEvent.getSource(),
			sSelectedKey = oSelect.getSelectedKey();
			
			var oModel = this.getView().getModel("existingOwnersModel"),
				aOwners = oModel.getData().owners;
			
			var oOwner = aOwners.find(function(item) { return item.id === sSelectedKey; }),
				oSelectedOwnerModel = this.getView().getModel("selectedNewOwnerModel");
			oSelectedOwnerModel.setData(oOwner);
		},
		
		onChangeOwnerBtnPress: function() {
			var sFragId;
			if (!this._changeOwnerDialog) {
				sFragId = this.createId("idChangeOwnerDialogFrag");
				this._changeOwnerDialog = sap.ui.xmlfragment(sFragId, "car.lease.CarLeaseDemo.fragments.ChangeVehicleOwner", this);
				this.getView().addDependent(this._changeOwnerDialog);
			}
			//this._changeOwnerDialog.setModel(this.getView().getModel("DeferCodeModel"));
			this._changeOwnerDialog.open();
		},
		
		onDetailPress: function(oEvent) {
			var oSelectedItem = oEvent.getSource().getSelectedItem(),
				sSelectedVehicleId = oSelectedItem.getCells()[0].getProperty("text");
				
			if (sSelectedVehicleId) {
				var oSelectedVehicleModel = this.getView().getModel("selectedVehicleModel"),
					oModel = this.getView().byId("CarLeaseWorklistTable").getModel(),
					aVehicles = oModel.getData().vehicles;
				
				var oSelectedVehicle = aVehicles.find(function(item) { return item.v5cID === sSelectedVehicleId });
				oSelectedVehicleModel.setData(oSelectedVehicle);
			}
		},
		
		onChangeVehicleOwnerDialogCancel: function() {
			if (this._changeOwnerDialog) {
				this._changeOwnerDialog.close();
			}
		},
		
		onChangeVehicleOwnerDialogOK: function() {
			var oModel = this.getView().getModel("selectedVehicleModel"),
				data = oModel.getData(),
				serviceUrl = this.serviceKey.serviceUrl + this.serviceKey.chaincodePath + this.serviceKey.vehicleOwnerPath + data.v5cID,
				xhr = new XMLHttpRequest(),
				oSelectedOwnerModel = this.getView().getModel("selectedNewOwnerModel"),
				that = this;

			var selectedOwnerData = oSelectedOwnerModel.getData();
			
			var dataToSend = {
				"id": data.v5cID, //vehicle id
				"ownerId2": selectedOwnerData.id //owner id
			}

			xhr.open("PUT", serviceUrl);
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.setRequestHeader("Authorization", "Bearer " + this.accessToken);
			xhr.onload = function () {
				if (xhr.status === 200) {
					MessageToast.show("Owner has been changed");
					that.onChangeVehicleOwnerDialogCancel();
					oModel.setProperty("/", "");
					oSelectedOwnerModel.setProperty("/", "");
					that.refreshWorklist();
				} else {
					MessageToast.show("Calling the 'Change Owner' API failed");
				}
			};
			xhr.send(JSON.stringify(dataToSend));
		}
	});
});