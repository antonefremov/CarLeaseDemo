sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
	"use strict";

	return Controller.extend("car.lease.CarLeaseDemo.controller.View1", {

		accessToken: null,

		serviceKey: {
			// "channelId": "dev627077c8-e9a6-4ffb-b368-01ef0c303dd5carlease.vehicle",
			"serviceUrl": "https://hyperledger-fabric.cfapps.eu10.hana.ondemand.com/api/v1",
			"chaincodePath": "/chaincodes/627077c8-e9a6-4ffb-b368-01ef0c303dd5-com-sap-blockchain-carlease/latest/",
			"vehiclesPath": "vehicles/",
			"oAuth": {
				"clientId": "sb-34d0015d-0a99-496a-8fcd-e74ea546e694!b5485|na-420adfc9-f96e-4090-a650-0386988b67e0!b1836",
				"clientSecret": "IUTA1zPBP0ZO2m7k75nqDvAIo6w=",
				"url": "https://i300455trial.authentication.eu10.hana.ondemand.com"
			}
		},

		onInit: function () {
			var oViewModel = new JSONModel({});
			this.getView().setModel(oViewModel, "newUserModel");
			var that = this;
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
		}

	});
});