// Options JavaScript Document

/*
 * Formalizr, Google Chrome extension
 * Copyright (c) 2014-2019 www.dennisbabkin.com
 *
 *     https://dennisbabkin.com/formalizr/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */




//Gloval functions
gl = {

	gnThisTabID: null,					//ID of the Chrome tab the Options is displayed in
	gstrSelTabId: null,					//ID of the Options tab (control on the page) that is currently selected, example: "#tabGeneral"

	//Singleton data, loaded only once
	gSngltnPrmpts: {
		strSavedOK: null,			//"Saved changes", if not null
		strRemovedOK: null,			//"Removed data", if not null
		strImportedOK: null,		//"Imported data", if not null
		strSavedErr: null,			//"Saving failed", if not null

		strXcptsSelType_0: null,	//Selection for "Exception type"
		strXcptsSelType_1: null,
		strXcptsSelType_2: null,
		strXcptsSelType_3: null,
		strXcptsSelType_4: null,

		strXcptsUsesRegExp: null,	//" (Uses RegExp)", if not null

		loadSingletons: function()
		{
			//Load values in this struct
			if(this.strSavedOK === null)
				this.strSavedOK = chrome.i18n.getMessage("msg_save_ok");

			if(this.strRemovedOK === null)
				this.strRemovedOK = chrome.i18n.getMessage("msg_remove_ok");

			if(this.strImportedOK === null)
				this.strImportedOK = chrome.i18n.getMessage("msg_import_ok");

			if(this.strSavedErr === null)
				this.strSavedErr = chrome.i18n.getMessage("msg_save_err");

			if(this.strXcptsSelType_0 === null)
				this.strXcptsSelType_0 = chrome.i18n.getMessage("sel_XcptsSelType_0");
			if(this.strXcptsSelType_1 === null)
				this.strXcptsSelType_1 = chrome.i18n.getMessage("sel_XcptsSelType_1");
			if(this.strXcptsSelType_2 === null)
				this.strXcptsSelType_2 = chrome.i18n.getMessage("sel_XcptsSelType_2");
			if(this.strXcptsSelType_3 === null)
				this.strXcptsSelType_3 = chrome.i18n.getMessage("sel_XcptsSelType_3");
			if(this.strXcptsSelType_4 === null)
				this.strXcptsSelType_4 = chrome.i18n.getMessage("sel_XcptsSelType_4");

			if(this.strXcptsUsesRegExp === null)
				this.strXcptsUsesRegExp = " (" + chrome.i18n.getMessage("sel_XcptsUsesRegExp") + ")";
		}
	},
	
	gSvdMsg: {
		timerID: null,					//Timer ID for hiding "Saved changes" message
		bAnimOn: false					//True if fade-out animation is currently on
	},


	//Global constants
	gnAdvSldrFreqGrad_DataColFreq: 10,			//Gradation in ms for the slider (must be less or equal to 'gnAdvSldrFreqGradBtn_DataColFreq'!)
	gnAdvSldrFreqGradBtn_DataColFreq: 100,		//Gradation in ms for < or > button of the slider

	gnAdvSldrFreqGrad_PersistSaveFreq: 1000,	//Gradation in ms for the slider (must be less or equal to 'gnAdvSldrFreqGradBtn_PersistSaveFreq'!)
	gnAdvSldrFreqGradBtn_PersistSaveFreq: 1000,	//Gradation in ms for < or > button of the slider
	

    localizeHtmlPage: function ()
    {
        //Localize all HTML elements by replacing __MSG_***__ meta tags in all attributes & inner text

        //Look through the whole document
        var objects = document.getElementsByTagName('html');
        for (var j = 0; j < objects.length; j++)
        {
            var obj = objects[j];

            //Check for special meta tags
            var valStrH = obj.innerHTML.toString();
            var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
            {
				var txt = v1 ? chrome.i18n.getMessage(v1) : ""
                return txt ? txt : (v1 ? v1 : "");
            });

            if(valNewH != valStrH)
            {
                obj.innerHTML = valNewH;
            }
        }


    },

	makeNonDraggable: function()
	{
		//Make all links & images on page on draggable
		$("a").each(function(i)
		{
			var obj = $(this);

			//Make them non-draggable --  draggable="false"
			obj.attr('draggable', false);
		});

		//Do images
		$("img").each(function(i)
		{
			var obj = $(this);

			//Make them non-draggable --  draggable="false"
			obj.attr('draggable', false);
		});
	},

	logExceptionReport: function(specErr, err)
    {
        //Log exception through the background page
        var bgPage = chrome.extension.getBackgroundPage();
        bgPage.gl.logExceptionReport(specErr, err);
    },

	logReport: function(strMsg)
    {
        //Log report through the background page
        var bgPage = chrome.extension.getBackgroundPage();
        bgPage.gl.logReport(strMsg);
    },

	logWarning: function(strMsg)
	{
		//Log warning info debugger console
        var bgPage = chrome.extension.getBackgroundPage();
        bgPage.gl.logWarning(strMsg);
	},

	logError: function(strMsg)
    {
        //Log report through the background page
        var bgPage = chrome.extension.getBackgroundPage();
        bgPage.gl.logError(strMsg);
    },


	overrideConsole: function()
	{
		//Override calls to console.*() methods

		//Log
		if(!gl._fnConsoleLog)
		{
			gl._fnConsoleLog = console.log;
			console.log = function()
			{
				//Call original method
				gl._fnConsoleLog.apply(console, arguments);

				if(arguments.length > 0)
				{
					//Call override
					gl.logReport(arguments[0]);
				}
			}
		}

		//Warning
		if(!gl._fnConsoleWarn)
		{
			gl._fnConsoleWarn = console.warn;
			console.warn = function()
			{
				//Call original method
				gl._fnConsoleWarn.apply(console, arguments);

				if(arguments.length > 0)
				{
					//Call override
					gl.logWarning(arguments[0]);
				}
			}
		}

		//Error
		if(!gl._fnConsoleErr)
		{
			gl._fnConsoleErr = console.error;
			console.error = function()
			{
				//Call original method
				gl._fnConsoleErr.apply(console, arguments);

				if(arguments.length > 0)
				{
					//Call override
					gl.logError(arguments[0]);
				}
			}
		}
	},
	_fnConsoleLog: null,		//[Used internally]
	_fnConsoleWarn: null,		//[Used internally]
	_fnConsoleErr: null,		//[Used internally]


    encodeHtml: function(txt)
    {
        //Encode 'txt' to be placed into HTML attribute
        //RETURN:
        //      = Encoded string
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.encodeHtml(txt);
    },

    abbrevString: function(str, nMaxLen)
    {
        //Abbreviate 'str' if it's longer than 'nMaxLen' chars in length
        //INFO: If abbreviated, will have "..." added at the end
        //RETURN:
        //      = Abbreviated string, or original one
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.abbrevString(str, nMaxLen);
    },

	isInt: function(v)
	{
		//RETURN:
		//		= true if 'v' is an integer, exaple:
		//			isInt(42)	         // true
		//			isInt("42")			 // true
		//			isInt(4e2)			 // true
		//			isInt("4e2")	     // true
		//			isInt('4e2')	     // true
		//			isInt(" 1 ")	     // true
		//			isInt(42.0)	         // true
		//			isInt("")	         // false
		//			isInt("  ")	         // false
		//			isInt(42.1)	         // false
		//			isInt(null)	         // false
		//			isInt(undefined)	 // false
		//			isInt(NaN)	         // false
		//			More info:	http://stackoverflow.com/q/14636536/843732
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.isInt(v);
	},

	isRegExpValid: function(regExp)
	{
		//Checks if 'regExp' is a valied regexp that can be used in RegExp.test() method
		//RETURN:
		//		= true if yes, it is valid
		//		= false if not, it is not valid
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.isRegExpValid(regExp);
	},

	getSettingsRef: function()
	{
		//RETURN: Reference to settings object, see 'gl.gSettings' in background.js
		//		  INFO: You can modify the original settings by modifying the returned object!
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.gSettings;
	},

	getDefaultSettingsRef: function()
	{
		//RETURN: Reference to default settings object, see 'gl.gSettings' in background.js
		//		  INFO: DO NOT modify the object!
        var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.gSettings_Default;
	},

	getStorageRef: function()
	{
		//RETURN: Reference to settings object, see 'gl.oStorage' in background.js
 		//		  INFO: You can modify the original storage object by modifying the returned object!
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.oStorage;
	},

	getMinMaxSettingsVals: function()
	{
		//Object with min and max values for settings
		//RETURN:
		//		= Object with keys for prop names, and values with props:
		//			'min' = minimum allowed value (inclusively)
		//			'max' = maximum allowed value (inclusively)
        var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getMinMaxSettingsVals();
	},

    clipboardCopyText: function(str, bNewLineSubst)
    {
        //Copy 'str' as text to the clipboard
		//'bNewLineSubst' = 'false' not to substitute new-lines
        //RETURN:
        //      = true if done
        try
        {
			var res = false;

			if(!str)
				str = "";

			if(bNewLineSubst !== false)
			{
				//Substitute new-lines according to a user selection in settings
				str = this.replaceNewLines(str);
			}

            document.oncopy = function(event) 
			{
				try
				{
					event.clipboardData.setData("Text", str.toString());
					event.preventDefault();

					//Done
					res = true;
				}
				catch(e)
				{
					//Exception
					gl.logExceptionReport(311, e);
				}
            };

            document.execCommand("Copy", false, null);
            document.oncopy = undefined;

            return res;
        }
        catch(e)
        {
            //Exception
            gl.logExceptionReport(215, e);

            return false;
        }
    },

	replaceNewLines: function(str)
	{
		//Substitute new-lines in 'str' with OS specific ones, according to user selection
        var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.replaceNewLines(str);
	},

	setStorageObject: function(objData)
	{
		//Replace existing storage object in 'gl.oStorage' with 'objData'
		//and update persistent storage
        var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.setStorageObject(objData, true);
	},

	setSettingsObject: function(objStgs, bUpdatePopups)
	{
		//Sets the entire settings object
		//IMPORTANT: It assumes that 'objStgs' is validated and correct!
		//'bUpdatePopups' = true to update by closing all popup windows
        var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.setSettingsObject(objStgs, bUpdatePopups);
	},

	clearAllPersistentStorage: function(nStgType, callbackDone)
	{
		//Clear all data from currently used persistent storage
		//'nStgType' = type of persistent storage to clear, or if not defined to use the value from global settings. Can be one of:
		//	0 = not to store in persistent storage (use browser's memory only)
		//	1 = localStorage
		//	2 = chrome.storage.local
 		//'callbackDone' = if specified, is called when done processing this function. It is called as such: callbackDone(res) where, res is one of:
		//						= 'true' if saved OK
		//						= Error description string, if failed to save
		var bgPage = chrome.extension.getBackgroundPage();
		bgPage.gl.clearAllPersistentStorage(nStgType, callbackDone);
	},


    showGeneralSettings: function()
    {
		//Open Chrome general settings, if no alreadt opened (in that case it switches to that tab or window)
		var bgPage = chrome.extension.getBackgroundPage();
		bgPage.gl.openGeneralSettingsWindow();
    },

	getThisAppName: function()
	{
		//RETURN:
		//		= This app's name as a string (Example: "Formalizr")
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.gstrAppName;
	},

	getThisAppVersion: function()
	{
		//RETURN:
		//		= This app's version as a string (Example: "1.0.0.0", or "1.0.0.0 beta")
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getThisAppVersion();
	},

	getCurrentTimeUTC: function()
	{
		//RETURN:
		//		= number of milliseconds between current UTC time and midnight of January 1, 1970
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getCurrentTimeUTC();
	},

	getSettingsExport: function(strDataID, nExtras, bPretty, callbackDone)
	{
		//'strDataID' = string ID for the export (example: "sttgsObjExport")
		//'nExtras' = include extra values, can be one of:
		//				1 = include extra global values (remove user-sensitive info)
		//				2 = include extra global values (nothing is removed)
		//				0 = do not include anything extra
		//'bPretty' = true to formar for human-readable form, false - in concise form
		//'callbackDone' = if specified, receives the result, as such: callbackDone(str), where:
		//					'str' =		[string] Special JSON for exported settings + other requested stuff
		//								null if error
		var bgPage = chrome.extension.getBackgroundPage();
		bgPage.gl.getSettingsExport(strDataID, nExtras, bPretty, callbackDone);
	},

	compareVersions: function(v1, v2)
	{
		//RETURN:
		//		= 0 if both are the same
		//		= 1 if v1 > v2
		//		= -1 if v1 < v2
		//		= NaN if error
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.compareVersions(v1, v2);
	},
	
    convertFromUTCTicks: function(nTicks)
    {
	    //'nTicks' = number of milliseconds since midnight of January 1, 1970
        //RETURN: 'nTicks' converted from UTC to local time

        //The offset is in minutes -- convert it to ms
        return nTicks - new Date().getTimezoneOffset() * 60000;
    },

    formatDateTimeFromTicks: function(nTicks)
    {
	    //'nTicks' = number of milliseconds since midnight of January 1, 1970
	    //RETURN:
	    //		= Formatted date/time
	    return new Date(nTicks).toLocaleString();
    },

	checkUrlExceptions: function(url)
	{
		//Checks 'url' against all exceptions
		//RETURN:
		//		= [0 and up) - index in 'gSettings.arrExcepts' array for the triggered exception, if URL did not pass -- DO NOT collect data
		//		= null - if URL passes and can be used to collect data
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.checkUrlExceptions(url);
	},

	getLastVisitedURL: function()
	{
		//RETURN:
		//		= Last visited URL, or
		//		= "" if none or not known
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getLastVisitedURL();
	},

	openURL: function(url)
	{
		//Open URL in a new tab
		//INFO: Opens it whether a tab with such URL already existed or not!
		//'url' = URL to open
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.openURL(url);
	},


	getMaxPersistStorageSize: function(nStgType)
	{
		//'nStgType' storage type to look up:
		//	1 = localStorage
		//	2 = chrome.storage.local
		//RETURN:
		//		= [Integer] for the maximum size of the persistent storage in bytes
		//		= 0 if error or unknown
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getMaxPersistStorageSize(nStgType);
	},

	getCurrentPersistStorageUsage: function(nStgType, callbackRes)
	{
		//Get current usage of the persistent storage by this app
		//'nStgType' storage type to look up:
		//	1 = localStorage
		//	2 = chrome.storage.local
		//'callbackRes' = if specified, the callback method to return result in. Will be called as such: callbackRes(nSz), where 'nSz' is one of:
		//					= [Integer] for the usage in bytes
		//					= -1 if error or unknown
		var bgPage = chrome.extension.getBackgroundPage();
		bgPage.gl.getCurrentPersistStorageUsage(nStgType, callbackRes);
	},


	showModalPrompt_OKCancel: function(strMsg, strTitle, strBtnOK, strBtnClose, callbackOnOK, callbackData)
	{
		//Show modal prompt (work asynchronously)
		//'strMsg' = message to display (can use '\n' for new-lines)
		//'strTitle' = title message
		//'strBtnOK' = message for OK button
		//'strBtnClose' = message for Cancel button
		//'callbackOnOK' = function to call if user chose OK button
		//'callbackData' = object with data to pass to 'callbackOnOK' function as parameter
		//RETURN:
		//		= true if showed dialog OK
		//		= false if error showing
		var nRes = false;

		try
		{
			//Set message
			$('#dialog-confirm-msgtxt').html(strMsg.replace(/\n/g, '<br />'));
	
			//Display a model window
			$( "#dialog-confirm" ).dialog({
				resizable: false,
				height: 'auto',
				modal: true,
				title: strTitle,
				buttons: [
				{
					text: strBtnOK,
					click: function()
					{
						//OK button
			
						//Close dialog
						$(this).dialog("close");

						//Invoke callback method
						if(callbackOnOK)
							callbackOnOK(callbackData);
					}
				},
				{
					text: strBtnClose,
					click: function() 
					{
						//Close dialog
						$(this).dialog("close");
					}
				}]
			});

			//Showed OK
			nRes = true;
		}
		catch(e)
		{
            //Exception
            gl.logExceptionReport(117, e);
			nRes = false;
		}

		return nRes;
	},



	enableDisableCtrls: function(arrIDs, bEnable)
	{
		//Enable/disable controls
		//'arrIDs' = array with control IDs

		var strDisbldClr = "#cccccc";

		for(var i = 0; i < arrIDs.length; i++)
		{
			var obj = document.getElementById(arrIDs[i]);
			if(obj)
			{
				//Get element tag
				if(obj.nodeName == 'INPUT')
				{
					//Get item type
					var type = obj.type ? obj.type.toLowerCase() : "";

					if(type == 'checkbox')
					{
						//Checkbox
						obj.disabled = !bEnable;

						//Get label
						var objLbl = obj.parentElement;
						if(objLbl &&
							objLbl.nodeName == 'LABEL')
						{
							//Change label color
							objLbl.style.color = bEnable ? "" : strDisbldClr;
						}
					}
				}
				else if(obj.nodeName == 'SELECT' ||
					obj.nodeName == 'LEGEND')
				{
					//Combo box
					obj.disabled = !bEnable;
					obj.style.color = bEnable ? "" : strDisbldClr;
				}
			}
		}
	},


	onCheckForUpdates: function(elmt)
	{
		//Called when the link to "Check for updates" was clicked
		//'elmt' = DOM element for <a> that was clicked

		//See if we already clicked it?
		if(!elmt.bUpdateAvail)
		{
			console.log("[181] Checking for updates");

			var objLink = $("#" + elmt.id);

			//First hide the link
			objLink.fadeOut({
				duration: 200,
				complete: function()
				{
					//When animation ends

					//Begin checking for an update
					chrome.runtime.requestUpdateCheck(function(status, details)
					{
						//Done checking
						console.log("[182] Update check result: " + status + ", v=" + details.version);

						//status = 'update_available';
						//details.version = "12.345.234.5312";

						//Trim the status
						status = status ? status.toString().toLowerCase() : "";

						var strMsg;

						//Set the tag back
						switch(status)
						{
							case 'no_update':
								elmt.bUpdateAvail = false;
								objLink.attr("style", "color: #bababa !important");
								strMsg = chrome.i18n.getMessage("msg_no_update");
								break;
							case 'update_available':
								elmt.bUpdateAvail = true;
								objLink.attr("style", "color: #01ca2b !important");
								strMsg = chrome.i18n.getMessage("msg_yes_update").replace("#V#", details.version ? details.version : "?");
								break;
							default:
								elmt.bUpdateAvail = false;
								objLink.attr("style", "color: #ca0101 !important");
								strMsg = chrome.i18n.getMessage("msg_err_update");
								break;
						}

						//Set text and title
						objLink.text(strMsg);
						objLink.attr("title", gl.encodeHtml(strMsg));

						//And show it
						objLink.fadeIn();

					});
				}
			});
		}
		else
		{
			//Install update -- it was marked as available
			console.log("[183] Manually reloading to install update");

			//Let background.js do the work
			var bgPage = chrome.extension.getBackgroundPage();
			bgPage.gl.onInstallUpdate();
		}
	},


	saveSettings: function(nShowRes, callbackDone)
	{
		//Save current savings object and show a user message if it was saved successfully or failed
		//'nShowRes' = if specified, can be one of:
		//			3 = if success importing data
		//			2 = if success removing data
		//			1 = if success saving (assumed by default)
		//			0 = if error saving
		//			-1 = not show any messages
		//'callbackDone' = if used, callback method that will be called at the end as such: callbackDone(res), where 'res' can be one of:
		//					'true'	= saving success
		//					string	= if error saving

		try
		{
			var bgPage = chrome.extension.getBackgroundPage();
			bgPage.gl.onPersistentSaveSettings(function(res)
			{
				//						= true - if saved successfully
				//						= String - if not saved, has error message
				if(res === true)
				{
					//All done
					if(nShowRes != -1)
						gl.setSavedResultTxt(nShowRes !== undefined && nShowRes !== null ? nShowRes : 1);

					if(callbackDone)
						callbackDone(true);
				}
				else
				{
					//Failed
					if(nShowRes != -1)
						gl.setSavedResultTxt(0);

					console.error("[202] Failed to save settings: " + res);

					if(callbackDone)
						callbackDone(res);
				}
			});
		}
		catch(e)
		{
			//Error
            gl.logExceptionReport(203, e);

			if(callbackDone)
				callbackDone("[288] Err");
		}
	},

	saveFailed: function()
	{
		//Shows a user message that data saving failed
		gl.setSavedResultTxt(0);
	},

	setSavedResultTxt: function(nRes)
	{
		//Update saving result message displayed for the user
		//'nRes' = can be one of:
		//			3 = if success importing data
		//			2 = if success removing data
		//			1 = if success saving
		//			0 = if error saving

		//Is animation currently on
		if(gl.gSvdMsg.bAnimOn)
		{
			//Need to try this at a later time when it's done
			//console.log("Resched nRes=" + nRes);
			window.setTimeout(function()
			{
				//Try again
				gl.setSavedResultTxt(nRes);
			}, 
			1);

			return;
		}

		//Get control itself (as a <span> element inside the <div>)
		var objSpan = $("#divSavd>span");

		//Show it
		objSpan.show();

		//Set message
		if(nRes == 1)
		{
			//Success
			objSpan.text(gl.gSngltnPrmpts.strSavedOK);
			objSpan.attr("class", "svdOK");
		}
		else if(nRes == 2)
		{
			//Removed OK
			objSpan.text(gl.gSngltnPrmpts.strRemovedOK);
			objSpan.attr("class", "svdOK");
		}
		else if(nRes == 3)
		{
			//Imported OK
			objSpan.text(gl.gSngltnPrmpts.strImportedOK);
			objSpan.attr("class", "svdOK");
		}
		else
		{
			//Error
			objSpan.text(gl.gSngltnPrmpts.strSavedErr);
			objSpan.attr("class", "svdErr");
		}

		//Do we have a previously running timer?
		if(gl.gSvdMsg.timerID)
		{
			//Clear it
			window.clearTimeout(gl.gSvdMsg.timerID);
			gl.gSvdMsg.timerID = null;
		}

		//Set timer to remove it
		gl.gSvdMsg.timerID = window.setTimeout(function()
		{
			//Clear the timer
			gl.gSvdMsg.timerID = null;

			//Set flag that animation is on
			gl.gSvdMsg.bAnimOn = true;

			objSpan.fadeOut({
				duration: 200,
				complete: function()
				{
					//When animation ends

					//Remove message
					objSpan.text("");
					objSpan.removeAttr("class");

					//Anim is done
					gl.gSvdMsg.bAnimOn = false;
				}
			});

		},
		3000);
	},


	onTabSelected: function(nTabIndex, bShiftClick)
	{
		//Called when tab was selected
		//'nTabIndex' = [0 and up) tab index that got activated
		//'bShiftClick' = true if user shift-clicked the tab (for additional data)
		
		//Convert index into tab ID
		var strTabID = gl.getTabDomIDByIndex(nTabIndex);
		
		switch(strTabID)
		{
			case '#tabGeneral':
			{
				gl.onTabSelected_General();
			}
			break;

			case '#tabMemory':
			{
				gl.onTabSelected_Memory(bShiftClick);
			}
			break;

			case '#tabStorage':
			{
				gl.onTabSelected_Storage(bShiftClick);
			}
			break;
			
			case '#tabIncognito':
			{
				gl.onTabSelected_Incognito();
			}
			break;
			
			case '#tabExceptions':
			{
				gl.onTabSelected_Exceptions();
			}
			break;
			
			case '#tabAdvanced':
			{
				gl.onTabSelected_Advanced();
			}
			break;
			
			default:
			{
				console.error("[179] No handler for tab `" + strTabID + "`, index=" + nTabIndex);
			}
			break;
		}
		
		//Set tab selected
		gl.gstrSelTabId = strTabID;

	},
	
	
	onTabSelected_General: function()
	{
		//Called when "General" tab was selected

		//Update controls in the tab
		gl.updateTabCtrls_General();

	},


	onTabSelected_Memory: function(bShiftClick)
	{
		//Called when "Memory" tab was selected
		//'bShiftClick' = true if user shift-clicked the tab (for additional data)

		//Show/hide special section
		if(bShiftClick)
		{
			$("#idFsAdvMemOps").show();
		}
		else
		{
			$("#idFsAdvMemOps").hide();
		}

		//Update controls in the tab
		gl.updateTabCtrls_Memory();

	},


	onTabSelected_Storage: function(bShiftClick)
	{
		//Called when "Storage" tab was selected
		//'bShiftClick' = true if user shift-clicked the tab (for additional data)

		//Update controls in the tab
		gl.updateTabCtrls_Storage();

	},


	onTabSelected_Incognito: function()
	{
		//Called when "Incognito" tab was selected
		
		//Set Settings href
		$("#linkSettings").attr("href", "#");

		//Set Settings link in the Warning message
		$("#linkSettings").click(function(e)
		{
			//Prevent default actions on the link
			e.stopPropagation();
			e.preventDefault();

			//Open general settings window
			gl.showGeneralSettings();
		});

		//Update controls in the tab
		gl.updateTabCtrls_Incognito();

	},

	onTabSelected_Exceptions: function()
	{
		//Called when "Exceptions" tab was selected
		
		gl.updateTabCtrls_Exceptions();
	},


	onTabSelected_Advanced: function()
	{
		//Called when "Advanced" tab was selected
		
		gl.updateTabCtrls_Advanced();
	},


	getTabIndexByDomID: function(strDomTabID)
	{
		//'strDomTabID' = case-sensitive DOM tab ID, example: "#tabGeneral"
		//RETURN:
		//		= Tab index by a DOM ID
		//		= -1 if not found
		var index = $('#tabs a[href="' + strDomTabID + '"]').parent().index();

		return index;
	},

	getTabDomIDByIndex: function(nTabInd)
	{
		//RETURN:
		//		= Tab DOM id by its index (example: "#tabGeneral"), or
		//		= 'undefined' if no such tab index
		return $("#tabs ul>li>a").eq(nTabInd).attr("href");
	},


	updateTabCtrls: function()
	{
		//Update controls for the currently selected tab
		switch(gl.gstrSelTabId)
		{
			case '#tabGeneral':
			{
				gl.updateTabCtrls_General();
			}
			break;

			case '#tabMemory':
			{
				gl.updateTabCtrls_Memory();
			}
			break;

			case '#tabStorage':
			{
				gl.updateTabCtrls_Storage();
			}
			break;

			case '#tabIncognito':
			{
				gl.updateTabCtrls_Incognito();
			}
			break;

			case '#tabExceptions':
			{
				gl.updateTabCtrls_Exceptions();
			}
			break;

			case '#tabAdvanced':
			{
				gl.updateTabCtrls_Advanced();
			}
			break;

			default:
			{
				console.error("[184] No handler for tab '" + gl.gstrSelTabId + "'");
			}
			break;
		}
	},


	updateTabCtrls_General: function()
	{
		//Update controls on the General page

		//Get settings object
		var stngs = gl.getSettingsRef();

		//Set checkboxes
		var bCollect = stngs.bCollectData ? true : false;
		$("#chkCollectData").prop('checked', bCollect);

		// 0x1 =		collect textarea
		// 0x2 =		collect "contentEditable" html elements (and treat them as textarea in our "popup" window)
		// 0x4 =		collect input: text
		// 0x8 =		collect input: email
		// 0x10 =		collect input: number
		// 0x20 =		collect input: search
		// 0x40 =		collect input: tel
		// 0x80 =		collect input: url
		// 0x20000 =	collect data from elements that are marked for "autocomplete off"
		$("#chkSingleLine").prop('checked', !!(stngs.nCollectFlgs & 0x4));
		$("#chkMultiLine").prop('checked', !!(stngs.nCollectFlgs & 0x1));
		$("#chkFmtInput").prop('checked', !!(stngs.nCollectFlgs & 0x2));
		$("#chkNumberTbxs").prop('checked', !!(stngs.nCollectFlgs & 0x10));
		$("#chkSearchTbxs").prop('checked', !!(stngs.nCollectFlgs & 0x20));
		$("#chkURLTbxs").prop('checked', !!(stngs.nCollectFlgs & 0x80));
		$("#chkEmailTbxs").prop('checked', !!(stngs.nCollectFlgs & 0x8));
		$("#chkTelTbxs").prop('checked', !!(stngs.nCollectFlgs & 0x40));
		$("#chkColAutocmplt").prop('checked', !!(stngs.nCollectFlgs & 0x20000));

		//Enable controls
		gl.enableGeneralTabCtrls(bCollect);
	},


	enableGeneralTabCtrls: function(bCollectData)
	{
		//'bCollectData' = can be true or false if data is known, otherwise will look it up automatically

		if(bCollectData !== true &&
			bCollectData !== false)
		{
			//Get it from current selection
			bCollectData = $("#chkCollectData").is(':checked') ? true : false;
		}

		var ctrlIDs = ["chkSingleLine", "chkMultiLine", "chkFmtInput", "chkNumberTbxs", "chkSearchTbxs", "chkURLTbxs", "chkEmailTbxs", "chkTelTbxs", "chkColAutocmplt"];

		gl.enableDisableCtrls(ctrlIDs, bCollectData);
	},


	updateTabCtrls_Memory: function()
	{
		//Update controls on the Memory page

		//Get settings object
		var stngs = gl.getSettingsRef();

		//Set storage sliders
        var objSliderMaxNumPgs = document.getElementById("idRangeMaxNumPgs");
        var objSliderMaxNumTbxPerPg = document.getElementById("idRangeMaxNumTbxPerPg");
        var objSliderMaxNumEntrysPerTbx = document.getElementById("idRangeMaxNumEntrysPerTbx");

		//Set sliders
		objSliderMaxNumPgs.value = stngs.nMaxPageNum;
		objSliderMaxNumTbxPerPg.value = stngs.nMaxTxBxNum;
		objSliderMaxNumEntrysPerTbx.value = stngs.nMaxTxtValNum;

		//Set number values
		$("#idSldrMaxNumPgs").text(stngs.nMaxPageNum.toString());
		$("#idSldrMaxNumTbxPerPg").text(stngs.nMaxTxBxNum.toString());
		$("#idSldrMaxNumEntrysPerTbx").text(stngs.nMaxTxtValNum.toString());

		//Set number of collected web pages
		var oStorage = gl.getStorageRef();
		var nCntRecs = Object.keys(oStorage).length;
		$("#idFtrMemColWbPgs").text(chrome.i18n.getMessage("msg_idFtrMemColWbPgs") + " " + nCntRecs.toString());


	},

	onApplyChanges_Memory: function()
	{
		//Link to apply changes
		if(gl.normalizeFormDataToStorage())
		{
			//Success
			gl.saveSettings();
		}
		else
		{
			//Error
			gl.saveFailed();
		}

		//And update our page
		gl.updateTabCtrls_Memory();
	},

	updateTabCtrls_Storage: function()
	{
		//Update controls on the Storage page

		//Get settings object
		var stngs = gl.getSettingsRef();

		//Set radio buttons for persist storage type
		$("#radStgTypeNone").prop('checked', stngs.nPersistStorageType == 0);
		$("#radStgTypeLocalStorage").prop('checked', stngs.nPersistStorageType == 1);
		$("#radStgTypeChromeLocal").prop('checked', stngs.nPersistStorageType == 2);

		//Update storage usage bar (and show/hide footer message)
		gl.updateStorageUsageBar(true);


//		window.setInterval(function()
//		{
//			var p = window.__p;
//			if(p === undefined)
//				p = 0;
//			else
//				p += 0.1;

//			if(p > 100)
//				p = 0;

//			window.__p = p;

//			gl.setStorageFillBar(p);
//		},
//		100);


	},


	onSliderPosChanged_MaxNumPgs: function(elmt)
	{
		//Called when slider is dragged to a new position
		//'elmt' = slider DOM element
		var nPos = parseInt(elmt.value, 10);

		//Set number value
		$("#idSldrMaxNumPgs").text(nPos.toString());

		//Get min/max values
		var objMinMax = gl.getMinMaxSettingsVals();

		//Make sure that we're within limits
		if(nPos >= objMinMax.nMaxPageNum.min &&
			nPos <= objMinMax.nMaxPageNum.max)
		{
			//Set settings value
			gl.getSettingsRef().nMaxPageNum = nPos;
			gl.saveSettings();
		}
		else
		{
			//Otherwise failed
			gl.saveFailed();
		}
	},

	onButtonLess_MaxNumPgs: function(elmt)
	{
		//Called when "Less" button was clicked
		//'elmt' = button DOM element

		//Get slider
        var objSlider = document.getElementById("idRangeMaxNumPgs");

		var nPos = objSlider.value;

		nPos--;
		if(nPos < objSlider.min)
			nPos = objSlider.min;

		//Set new pos
		objSlider.value = nPos;

		//Process value change
		gl.onSliderPosChanged_MaxNumPgs(objSlider);
	},

	onButtonMore_MaxNumPgs: function(elmt)
	{
		//Called when "More" button was clicked
		//'elmt' = button DOM element

		//Get slider
        var objSlider = document.getElementById("idRangeMaxNumPgs");

		var nPos = objSlider.value;

		nPos++;
		if(nPos > objSlider.max)
			nPos = objSlider.max;

		//Set new pos
		objSlider.value = nPos;

		//Process value change
		gl.onSliderPosChanged_MaxNumPgs(objSlider);
	},




	onSliderPosChanged_MaxNumTbxPerPg: function(elmt)
	{
		//Called when slider is dragged to a new position
		//'elmt' = slider DOM element
		var nPos = parseInt(elmt.value, 10);

		//Set number value
		$("#idSldrMaxNumTbxPerPg").text(nPos.toString());

		//Get min/max values
		var objMinMax = gl.getMinMaxSettingsVals();

		//Make sure that we're within limits
		if(nPos >= objMinMax.nMaxTxBxNum.min &&
			nPos <= objMinMax.nMaxTxBxNum.max)
		{
			//Set settings value
			gl.getSettingsRef().nMaxTxBxNum = nPos;
			gl.saveSettings();
		}
		else
		{
			//Otherwise failed
			gl.saveFailed();
		}
	},

	onButtonLess_MaxNumTbxPerPg: function(elmt)
	{
		//Called when "Less" button was clicked
		//'elmt' = button DOM element

		//Get slider
        var objSlider = document.getElementById("idRangeMaxNumTbxPerPg");

		var nPos = objSlider.value;

		nPos--;
		if(nPos < objSlider.min)
			nPos = objSlider.min;

		//Set new pos
		objSlider.value = nPos;

		//Process value change
		gl.onSliderPosChanged_MaxNumTbxPerPg(objSlider);
	},

	onButtonMore_MaxNumTbxPerPg: function(elmt)
	{
		//Called when "More" button was clicked
		//'elmt' = button DOM element

		//Get slider
        var objSlider = document.getElementById("idRangeMaxNumTbxPerPg");

		var nPos = objSlider.value;

		nPos++;
		if(nPos > objSlider.max)
			nPos = objSlider.max;

		//Set new pos
		objSlider.value = nPos;

		//Process value change
		gl.onSliderPosChanged_MaxNumTbxPerPg(objSlider);
	},



	onSliderPosChanged_MaxNumEntrysPerTbx: function(elmt)
	{
		//Called when slider is dragged to a new position
		//'elmt' = slider DOM element
		var nPos = parseInt(elmt.value, 10);

		//Set number value
		$("#idSldrMaxNumEntrysPerTbx").text(nPos.toString());

		//Get min/max values
		var objMinMax = gl.getMinMaxSettingsVals();

		//Make sure that we're within limits
		if(nPos >= objMinMax.nMaxTxtValNum.min &&
			nPos <= objMinMax.nMaxTxtValNum.max)
		{
			//Set settings value
			gl.getSettingsRef().nMaxTxtValNum = nPos;
			gl.saveSettings();
		}
		else
		{
			//Otherwise failed
			gl.saveFailed();
		}
	},

	onButtonLess_MaxNumEntrysPerTbx: function(elmt)
	{
		//Called when "Less" button was clicked
		//'elmt' = button DOM element

		//Get slider
        var objSlider = document.getElementById("idRangeMaxNumEntrysPerTbx");

		var nPos = objSlider.value;

		nPos--;
		if(nPos < objSlider.min)
			nPos = objSlider.min;

		//Set new pos
		objSlider.value = nPos;

		//Process value change
		gl.onSliderPosChanged_MaxNumEntrysPerTbx(objSlider);
	},

	onButtonMore_MaxNumEntrysPerTbx: function(elmt)
	{
		//Called when "More" button was clicked
		//'elmt' = button DOM element

		//Get slider
        var objSlider = document.getElementById("idRangeMaxNumEntrysPerTbx");

		var nPos = objSlider.value;

		nPos++;
		if(nPos > objSlider.max)
			nPos = objSlider.max;

		//Set new pos
		objSlider.value = nPos;

		//Process value change
		gl.onSliderPosChanged_MaxNumEntrysPerTbx(objSlider);
	},




	updateStorageUsageBar: function(bUpdateFooterMsg)
	{
		//Update the bar showing current persistent storage usage
		//'bUpdateFooterMsg' = set to 'true' to also update footer message (show/hide it)

		//Get settings object
		var stngs = gl.getSettingsRef();

		//Only if persistent storage used
		//	0 = not to store in persistent storage (use browser's memory only)
		//	1 = localStorage
		//	2 = chrome.storage.local
		if(stngs.nPersistStorageType != 0)
		{
			//Get maximum possible storage
			//		= [Integer] for the maximum size of the persistent storage in bytes
			//		= 0 if error or unknown
			var nMaxSz = gl.getMaxPersistStorageSize(stngs.nPersistStorageType);

			//Get storage usage
			//	1 = localStorage
			//	2 = chrome.storage.local
			gl.getCurrentPersistStorageUsage(stngs.nPersistStorageType, function(nSz)
			{
				//'nSz' = can be one of:
				//					= [Integer] for the usage in bytes
				//					= -1 if error or unknown
				if(nMaxSz > 0 &&
					nSz >= 0)
				{
					//Calculate percentage
					var nUsg = nSz * 100 / nMaxSz;
					//nUsg = 49;

					//console.log("Usg=" + nUsg);

					//Display the bar
					gl.setStorageFillBar(nUsg);
				}
				else
				{
					//Error in data
					console.error("[212] Error in storage size data: nSz=" + nSz + ", nMaxSz=" + nMaxSz);

					//Display nothing
					gl.setStorageFillBar(null);
				}
			});

			if(bUpdateFooterMsg === true)
			{
				//Show footer
				$("#idLgndPersistStg").show();
			}
		}
		else
		{
			//No persistent storage
			gl.setStorageFillBar(null);

			if(bUpdateFooterMsg === true)
			{
				//Hide footer
				$("#idLgndPersistStg").hide();
			}
		}

	},


	setStorageFillBar: function(perc)
	{
		//Sets fill value to 'perc'
		//'perc' = value from [0 to 100], or null if unknown/error

		//Do we have a value?
		var bNull = (perc === null || perc === undefined);
		if(bNull)
			perc = 0;

		//Check it
		if(perc < 0)
			perc = 0;
		else if(perc > 100)
			perc = 100;
			
		//Set percent value (keep only 1 decimal number)
		//Get width of the fill bar
		var objFill = $("#idStrgUsgBar");
		var objParFill = objFill.parent();
		
		var w = objParFill.outerWidth();
		var h = objParFill.outerHeight() - 1;

		//Define the width of bar
		var w_f = w * perc / 100;

		//Get a canvas
		var cnvs = document.getElementById("idSmplCvs");
		cnvs.width = w;
		cnvs.height = h;
		
		//Get context
		var ctx = cnvs.getContext('2d');
		//var ctx = document.getCSSCanvasContext("2d", "bkgfill", w, h);

		ctx.clearRect(0, 0, w, h);
		ctx.globalAlpha = 0.5;

		//Get color for perc
		var clrBar = gl.getUsageBarColorForPerc(perc);
		ctx.fillStyle = clrBar;

		ctx.fillRect(0, 0, w_f, h);
		
		objFill.text(!bNull ? (perc.toFixed(1) + "%") : "-");
	},


	getUsageBarColorForPerc: function(perc)
	{
		//'perc' = value from [0 to 100]
		//RETURN:
		//		= color for percent in the form "rgb(r,g,b)"

		//Do we have an array
		if(!gl._gArrUsgBarClrs)
		{
			//Get context from the source bar (we'll use it to sample colors)
			var cvsSmpl = document.getElementById("idSmplCvs");
			var objSrcImg = $("#idUsgBarSrc");
			var srcImgW = objSrcImg.width();
			var ctxSrc = cvsSmpl.getContext('2d');
			ctxSrc.drawImage(objSrcImg[0], 0, 0);
			var imgData = ctxSrc.getImageData(0, 0, srcImgW, 1);

			//And make up our array
			gl._gArrUsgBarClrs = [];

			//Colors are presented as R, G, B, Alpha (or 4 indeces per pixel)
			for(var i = 0; i < imgData.data.length; i += 4)
			{
				gl._gArrUsgBarClrs.push("rgb(" + imgData.data[i] + "," + imgData.data[i + 1] + "," + imgData.data[i + 2] + ")");
			}
		}
	
		//Normalize it
		if(perc < 0)
			perc = 0;
		else if(perc > 100)
			perc = 100;

		//Use the color from array
		var nLen = gl._gArrUsgBarClrs.length;
		var ind = perc * nLen / 100;

		return gl._gArrUsgBarClrs[~~ind];		//Convert to int first
	},
	_gArrUsgBarClrs: null,						//Singleton


	updateTabCtrls_Incognito: function()
	{
		//Update controls on the Incognito page

		//Get settings object
		var stngs = gl.getSettingsRef();

		//See if this app is allowed to run in Incognito mode
		chrome.extension.isAllowedIncognitoAccess(function(isAllowedAccess)
		{
			//Show/hide the warning
			if(isAllowedAccess)
				$("#idIncogWarn").hide();
			else
				$("#idIncogWarn").show();

			//Set checkboxes
			$("#chkCollectFromIncog").prop('checked', stngs.bIncogCollectData);
			$("#chkSaveIncogData").prop('checked', stngs.bIncogSavePersistStorage);

			//Allow mixed data
			$("#idViewMxd").val(stngs.nViewIncogData.toString());

			//And update mixed data sel descr
			gl.updateAfterViewMxdChange(stngs.nViewIncogData);


			//Array of controls to disable/enable
			var arrIDs = ["chkCollectFromIncog", "chkSaveIncogData", "idLgndViewMxd", "idViewMxd", "idRstDefs_Incog"];

			gl.enableDisableCtrls(arrIDs, isAllowedAccess ? true : false);

			//Enable "Reset to default" link
			$("#idRstDefs_Incog").click(function(e)
			{
				//Prevent default actions on the link
				e.stopPropagation();
				e.preventDefault();

				//Only if enabled
				if(isAllowedAccess)
				{
					gl.resetToDefaults_Incognito();
				}
			});

		});
	},


	updateTabCtrls_Exceptions: function()
	{
		//Update controls on the Exceptions page

		gl.xcptsLoadList();
	},


	xcptsLoadList: function(nSelRowInd)
	{
		//Load & init exceptions list
		//'nSelRowInd' = if used, must point to selected row (index in the global 'gSettings.arrExcepts' array)

		//Get settings object
		var stngs = gl.getSettingsRef();

		//Reset "check-all" check
		$('#chkXcptsHdrAll').prop('checked', false);

		//Recreate exceptions list
		gl.createExceptionsTbl(nSelRowInd);

		//Update buttons
		gl.xcptUpdateLnkCtrls();
	},


	createExceptionsTbl: function(nSelRowInd)
	{
		//Create Exceptions list in a table
		//'nSelRowInd' = if used, must point to selected row (index in the global 'gSettings.arrExcepts' array)
		var html = "";

		//For info on formatting tables:
		//		http://css-tricks.com/complete-guide-table-element/
		//		http://codepen.io/mestremind/pen/IyDpa
		//		http://codepen.io/jgx/pen/wiIGc

		//Get settings object
		//	'mt'		= [string] match string, cannot be empty (always in lower case!)
		//	'rx'		= 'true' if 'mt' contains Regular Expressions, otherwise - if it's just a match string
		//	'tp'		= type of the match, one of:
		var arrEs = gl.getSettingsRef().arrExcepts;

		//Make array of exceptions references
		var arrXcpts = [];
		for(var i = 0; i < arrEs.length; i++)
		{
			arrXcpts.push({
				ind: i,
				mt:	arrEs[i].mt,	//[string] match string, cannot be empty (always in lower case!)
				rx:	arrEs[i].rx,	//'true' if 'mt' contains Regular Expressions, otherwise - if it's just a match string
				tp: arrEs[i].tp		//type of the match
			});
		}


		//Sort by URL in ascending order
		arrXcpts.sort(function(a, b){
			//1:    if 'a' is greater than 'b'
			//-1:   if 'a' is less than 'b'
			//0:    if 'a' is equal to 'b'
			if(a.mt > b.mt)
				return 1;
			else if(a.mt < b.mt)
				return -1;
			else
				return 0;
		});


		//Row ID to select, if not null
		var nSelRowID = null;


		//Did we get any exceptions
		if(arrXcpts.length > 0)
		{
			if(!gl.isInt(nSelRowInd))
			{
				//See if we have a previous selection?
				//		= [0 and up) Index of selected row, or
				//		= null if none
				nSelRowID = gl.xcptGetSelRow();
			}
			else
			{
				//Use provided row
				nSelRowID = nSelRowInd;
			}

			if(nSelRowID === null)
			{
				//Get last visited URL
				var strLastVstURL = gl.getLastVisitedURL();

				//Get row ID by it
				if(strLastVstURL)
				{
					//Try to locate last visited URL in exceptions
					//		= [0 and up) - index in 'gSettings.arrExcepts' array for the triggered exception, if URL did not pass -- DO NOT collect data
					//		= null - if URL passes and can be used to collect data
					nSelRowID = gl.checkUrlExceptions(strLastVstURL);
				}
			}


			//Get string
			var strType = gl.encodeHtml(chrome.i18n.getMessage("xcptsSelType"));

			//Go through all exceptions
			for(var r = 0; r < arrXcpts.length; r++)
			{
				var xcpt = arrXcpts[r];
				var rowID = xcpt.ind;

				//Add checkbox
				html += '<tr class="trXcptLn" xcptid="' + rowID + '"><td><input xcptid="' + rowID + '" class="chkXcptLn" type="checkbox" value="1"></td>';

				//Add type
				html += '<td><a href="#" class="lnkXcptLn">' + /*strType + ' ' +*/ 
					gl.encodeHtml(gl.getExceptStrForType(xcpt)) + '</a>';
				
				//Add URL
				html += '<span>' + gl.encodeHtml(xcpt.mt) + '</span></td></tr>';
			}
		}
		else
		{
			//No exceptions
			html += '<tr><td colspan="2" class="noEntrsXcpts">' + gl.encodeHtml(chrome.i18n.getMessage("xcptsNoExcepts")) + '</td></tr>';
		}

		//Set it in control
		document.getElementById("idBdyTblXcpts").innerHTML = html;


		//Add click events for the rows
		$(".trXcptLn").click(function(elmt)
		{
			//Row in the list is clicked
			var objRow = $(this);

			var rowID = objRow.attr('xcptid');

			//Select it
			gl.xcptSelectRow(rowID, true, true);

			//console.log("Row clicked=" + rowID);
		});

		//Add click events for checkboxes
		$(".chkXcptLn").change(function(elmt)
		{
			//Clicked any of the checkboxes in the list
			gl.xcptUpdateLnkCtrls();
		});

		//Add click events for edit links
		$(".lnkXcptLn").click(function(evt)
		{
			//First prevent its propagation
			evt.stopPropagation();
			evt.preventDefault();

			//Link to edit row is clicked
			var rowID = $(this).parent().parent().attr('xcptid');
			if(rowID)
			{
				gl.xcptEditException(rowID);
			}
		});


		//See if we need to select a row?
		if(nSelRowID !== null)
		{
			//Select it & scroll to it
			gl.xcptSelectRow(nSelRowID, true, false);
		}

	},


	//xcptAddRow: function(nRowInd)
	//{
	//	//Add a row
	//	//'nRowInd' = row index (it is equal to the index of the except in 'gl.gSettings.arrExcepts' array)
	//	//RETURN:
	//	//		= true if done
	//	var res = false;

	//	//Get exception array
	//	var arrEs = gl.getSettingsRef().arrExcepts;

	//	if(nRowInd >= 0 && nRowInd < arrEs.length)
	//	{
	//		//Add HTML for the item
	//	}

	//	return res;
	//},


	xcptUpdateRow: function(nRowInd)
	{
		//Update a row
		//'nRowInd' = row index to select (it is equal to the index of the except in 'gl.gSettings.arrExcepts' array)
		//RETURN:
		//		= true if done
		var res = false;

		//Get exception array
		var arrEs = gl.getSettingsRef().arrExcepts;

		if(nRowInd >= 0 && nRowInd < arrEs.length)
		{
			//Go through all rows
			$(".trXcptLn").each(function(i)
			{
				//Get this item
				var objRow = $(this);

				//See if this the item
				if(nRowInd == objRow.attr('xcptid'))
				{
					//Got it

					//Get 2nd <td> element
					var objTd2 = objRow.children("td:eq(1)");

					//Get link
					var objA = objTd2.find("a");
					var objSpan = objTd2.find("span");

					if(objA.length == 1 &&
						objSpan.length == 1)
					{
						//Success, update them
						res = true;

						var xcpt = arrEs[nRowInd];

						//Link of exception type
						objA.text(gl.getExceptStrForType(xcpt));

						//URL
						objSpan.text(xcpt.mt);
					}

					//Exit the 'each' loop
					return false;
				}
			});
		}

		return res;
	},


	xcptSelectRow: function(selRowID, bScrollToView, bAnimate)
	{
		//'selRowID' = row ID to select (it is equal to the index of the except in 'gl.gSettings.arrExcepts' array)
		//'bScrollToView' = true to scroll selected item into view if not visible
		//'bAnimate' = true to animate scroll

		//Go through all rows
		$(".trXcptLn").each(function(i)
		{
			//Get this item
			var objRow = $(this);

			//Is it our ID?
			if(objRow.attr('xcptid') != selRowID)
			{
				//Remove it
				objRow.removeClass('trXcptLnHilite');
			}
			else
			{
				//Add hiliting
				objRow.addClass('trXcptLnHilite');

				//Do we need to scroll it?
				if(bScrollToView)
				{
					//Get offset of the selected row
					var objDiv = $("#idDivXcpts");
					var offsRow = objRow.offset();
					var offsDiv = objDiv.offset();
					var nDivH = objDiv[0].clientHeight;				//Inner height of the client area of the housing DIV (including horiz scrollbar height)
					var nRowH = objRow.outerHeight(true);

					var nScrollY = null;

					//See if need to scroll
					if(offsRow.top < offsDiv.top)
					{
						//We need to scroll down
						nScrollY = offsRow.top - offsDiv.top;	//Negative
					}
					else if(offsRow.top + nRowH > offsDiv.top + nDivH)
					{
						//We need to scroll up
						nScrollY = offsRow.top + nRowH - (offsDiv.top + nDivH);
					}

					if(nScrollY)
					{
						//Get scroll pos of the main section
						var nScrollPos = objDiv.scrollTop();

						if(bAnimate === true)
						{
							//Now scroll the div
							objDiv.animate(
							{
								//Specify the number of pixels to scroll the '#mainSection' down
								scrollTop: nScrollY + nScrollPos
							}, 100);
						}
						else
						{
							//Scroll no anim
							objDiv.scrollTop(nScrollY + nScrollPos);
						}
					}
				}
			}
		});

	},


	xcptGetSelRow: function()
	{
		//RETURN:
		//		= [0 and up) Index of selected row, or
		//		= null if none
		var objRow = $(".trXcptLnHilite");
		if(objRow.length > 0)
		{
			var rowID = objRow.attr('xcptid');
			if(gl.isInt(rowID))
			{
				//Got it
				return parseInt(rowID, 10);
			}
		}

		return null;
	},

	xcptGetCheckedRows: function()
	{
		//RETURN: Array with checked rows -- each element is an object with the following props:
		//			'ind'		= index in 'gSettings.arrExcepts' array
		//			'mt'		= [string] match string, cannot be empty (always in lower case!)
		//			'rx'		= 'true' if 'mt' contains Regular Expressions, otherwise - if it's just a match string
		//			'tp'		= type of the match
		var resIDs = [];

		//Get exception array
		var arrExcpts = gl.getSettingsRef().arrExcepts;

		$(".chkXcptLn").each(function(i)
		{
			//Get this item
			var objRow = $(this);
			if(objRow.prop('checked'))
			{
				var nInd = parseInt(objRow.attr('xcptid'), 10);
				if(gl.isInt(nInd) &&
					nInd >= 0 &&
					nInd < arrExcpts.length)
				{
					//Use it
					resIDs.push({
						ind: nInd,
						mt: arrExcpts[nInd].mt,
						rx: arrExcpts[nInd].rx,
						tp: arrExcpts[nInd].tp
					});
				}
			}
		});

		return resIDs;
	},

	xcptUpdateLnkCtrls: function()
	{
		//Update "Add", "remove", "edit" links for exceptions

		//Count checked checkboxes
		var cnt = gl.xcptGetCheckedRows().length;

		//Count already existing exceptions
		var nCurExcpts = gl.getSettingsRef().arrExcepts.length;

		//Get max available excepts
		var bgPage = chrome.extension.getBackgroundPage();
		var nMaxMaxExcpts = bgPage.gl.gnMaxExcepts;

		//Get last visited page
		var strLastVstd = gl.getLastVisitedURL();

		//Act depending on selection
		gl.enableLink($("#idLnkXcptsEdit"), cnt == 1);
		gl.enableLink($("#idLnkXcptsRemove"), cnt > 0);
		gl.enableLink($("#idLnkXcptsAddNew"), nCurExcpts < nMaxMaxExcpts);

		//Add last visited
		var objLstVstd = $("#idLnkXcptsAddCurrent");
		gl.enableLink(objLstVstd, nCurExcpts < nMaxMaxExcpts && strLastVstd);

		if(strLastVstd)
		{
			//Add last visited site as a prompt
			objLstVstd.attr('title', strLastVstd);
		}
		else
		{
			//Remove title
			objLstVstd.removeAttr('title');
		}

	},


	enableLink: function(objA, bEnable)
	{
		//Enable/disable the <a> element from 'objA'
		//'objA' = jQuery object for the <a>
		//'bEnable' = true to enable.

		if(bEnable)
		{
			objA.removeAttr('style');
		}
		else
		{
			//Disable link
			objA.attr('style', 'pointer-events: none; cursor: default; color: #999 !important;');
		}
	},


	onXcptAddNew: function()
	{
		//Add new exception
		gl.xcptAddException();
	},

	onXcptAddLastVisited: function()
	{
		//Add new exception w/last visited URL
		gl.xcptAddException(gl.getLastVisitedURL());

	},

	onXcptEdit: function()
	{
		//Edit exception

		//Get checked checkboxes
		var chks = gl.xcptGetCheckedRows();
		if(chks.length == 1)
		{
			//Show edit window
			gl.xcptEditException(chks[0].ind);
		}
		else
		{
			//Error
			console.error("[265] Wrong number of checkboxes=" + chks.length);
		}
	},

	onXcptRemove: function()
	{
		//Remove exception(s)

		//Pick collected checked items
		//			'ind'		= index in 'gSettings.arrExcepts' array
		//			'mt'		= [string] match string, cannot be empty (always in lower case!)
		//			'rx'		= 'true' if 'mt' contains Regular Expressions, otherwise - if it's just a match string
		//			'tp'		= type of the match
		var chks = gl.xcptGetCheckedRows();
		if(chks.length > 0)
		{
			//Show warning
			gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_remove_xcpts").replace("#N#", chks.length), 
				chrome.i18n.getMessage("msg_title_remove"), 
				chrome.i18n.getMessage("btn_remove"), 
				chrome.i18n.getMessage("btn_cancel"),
				function()
				{
					//User chose to remove

					//Get exception array
					var arrExcpts = gl.getSettingsRef().arrExcepts;

					//Go through exceptions selected
					for(var i = 0; i < chks.length; i++)
					{
						//See if the item is still the same
						var nInd = chks[i].ind;

						if(nInd < 0 ||
							nInd >= arrExcpts.length ||
							arrExcpts[nInd].mt != chks[i].mt ||
							arrExcpts[nInd].rx != chks[i].rx ||
							arrExcpts[nInd].tp != chks[i].tp)
						{
							//Item has been changed, can't delete it
							console.warn("[276] Can't remove exception - it was changed since it was checked in the list: nInd=" + nInd + ", arrLn=" + arrExcpts.length + 
								", tp0=" + chks[i].tp + 
								", tp1=" + (nInd >= 0 && nInd < arrExcpts.length ? arrExcpts[nInd].tp : "-") + 
								", rx0=" + chks[i].rx + 
								", rx1=" + (nInd >= 0 && nInd < arrExcpts.length ? arrExcpts[nInd].rx : "-") + 
								", mt0=" + chks[i].mt + 
								", mt1=" + (nInd >= 0 && nInd < arrExcpts.length ? arrExcpts[nInd].mt : "-"));

							//Remove it from the list
							chks.splice(i, 1);
							i--;
						}
					}

					//Sort the list in descending order by 'ind'
					chks.sort(function(a, b){
						//1:    if 'a' is greater than 'b'
						//-1:   if 'a' is less than 'b'
						//0:    if 'a' is equal to 'b'
						return b.ind - a.ind;
					});


					//And now delete items (in reverse order)
					for(var i = 0; i < chks.length; i++)
					{
						var nInd = chks[i].ind;
						arrExcpts.splice(nInd, 1);
					}

					//Then save it
					gl.saveSettings();

					//Reload the list
					gl.xcptsLoadList();
				});
		}
		else
		{
			//Error
			console.error("[275] Wrong number of checkboxes=" + chks.length);
		}
	},


	xcptAddException: function(url)
	{
		//Show a popup window to add exception
		//INFO: If user choses to save it, applies settings as well (may display a user error too)
		//'url' = if defined, must contain the initial URL to display for the user as "Exception URL"

		//Count already existing exceptions
		var nCurExcpts = gl.getSettingsRef().arrExcepts.length;

		//Get max available excepts
		var bgPage = chrome.extension.getBackgroundPage();
		var nMaxMaxExcpts = bgPage.gl.gnMaxExcepts;

		//Make sure that we're not over the limit
		if(nCurExcpts < nMaxMaxExcpts)
		{
			//Do we have a URL?
			if(url)
			{
				//Stip it out to match type 1, or:
				//					1	= case-insensitive match of host name only (excluding www & port number), or: "slides.example.com"
				//INFO: This type will be used by default as defined in xcptShowEditWnd() method
				var m = url.match(/^(?:http|https)\:\/\/(?:www\.)?([^\/?#:]+)/i);					//If regexp is changed here, change it in toggleException() as well
				if(m && m.length > 1)
				{
					url = m[1];
				}
				else
				{
					//Current URL did not match
					console.warn("[274] Last visited URL did not suit for the exception: " + url);

					url = "";
				}
			}

			//Show the dialog for the user
			gl.xcptShowEditWnd(null, url, gl._onXcptAddEditException, function(res)
			{
				//Result:
				//					= [Object] with the following props if user OK'ed it:
				//								INFO: This data is not vetted!
				//								'ind'	= exception index in the global 'gSettings.arrExcepts' array, or null if it doesn't exist (like when adding new exception)
				//								'url'		= [string] exception URL, may be ""
				//								'rx'		= 'true' if 'url' contains Regular Expressions, otherwise - if it's just a match string
				//								'tp'		= [integer] type of exception (see 'gSettings.arrExcepts'), or NaN if error reading it off control
				//					= false if user canceled the window
				//					= null if error
				if(Object.prototype.toString.call(res) === '[object Object]')
				{
					//Got something
					var url = res.url;
					var bRx = res.rx;
					var nType = parseInt(res.tp, 10);

					//Normalize string
					url = url ? url.toString().trim().toLowerCase() : "";

					//Get exception array
					var arrExcpts = gl.getSettingsRef().arrExcepts;

					//Get min/max values
					var objMinMax = gl.getMinMaxSettingsVals();

					//Make sure data is correct
					//INFO: Data must be validated for a user by this spot!
					if(url &&
						gl.isInt(nType) &&
						nType >= objMinMax.arrExcepts.tp.min && nType <= objMinMax.arrExcepts.tp.max)
					{
						//Check regexp
						if(bRx !== true ||
							(bRx === true && gl.isRegExpValid(url)))
						{
							//Add it
							arrExcpts.push({
								mt: url,
								rx: bRx,
								tp: nType
							});

							//Save settings
							gl.saveSettings();

							//Reload the list (and select our new item)
							gl.xcptsLoadList(arrExcpts.length - 1);
						}
						else
						{
							//Bad exception
							console.error("[324] Bad exception regexp='" + url + "'");
						}
					}
					else
					{
						//Bad data
						console.error("[272] Bad exception data: url='" + url + "', tp=" + nType + ", ind=" + nInd + ", arrLn=" + arrExcpts.length);
					}
				}
				else if(res !== false)
				{
					//Error
					console.error("[271] Add exception failed: " + res);
				}
			});
		}
		else
		{
			//Too many
			gl.logError("[270] Can't add another exception, count=" + nCurExcpts);
		}
	},


	xcptEditException: function(nXcptInd)
	{
		//Show a popup window to edit exception with 'nXcptInd'
		//INFO: If user choses to save it, applies settings as well (may display a user error too)

		//First show the window to let user edit it
		gl.xcptShowEditWnd(nXcptInd, null, gl._onXcptAddEditException, function(res)
		{
			//Result:
			//					= [Object] with the following props if user OK'ed it:
			//								INFO: This data is not vetted!
			//								'ind'		= exception index in the global 'gSettings.arrExcepts' array, or null if it doesn't exist (like when adding new exception)
			//								'url'		= [string] exception URL, may be ""
			//								'rx'		= 'true' if 'url' contains Regular Expressions, otherwise - if it's just a match string
			//								'tp'		= [integer] type of exception (see 'gSettings.arrExcepts'), or NaN if error reading it off control
			//					= false if user canceled the window
			//					= null if error
			if(Object.prototype.toString.call(res) === '[object Object]')
			{
				//Got something
				var url = res.url;
				var bRx = res.rx;
				var nType = parseInt(res.tp, 10);
				var nInd = parseInt(res.ind, 10);

				//Normalize string
				url = url ? url.toString().trim().toLowerCase() : "";

				//Get exception array
				var arrExcpts = gl.getSettingsRef().arrExcepts;

				//Get min/max values
				var objMinMax = gl.getMinMaxSettingsVals();

				//Make sure data is correct
				//INFO: Data must be validated for a user by this spot!
				if(url &&
					gl.isInt(nType) &&
					nType >= objMinMax.arrExcepts.tp.min && nType <= objMinMax.arrExcepts.tp.max &&
					gl.isInt(nInd) &&
					nInd >= 0 && nInd < arrExcpts.length)
				{
					//Check regexp
					if(bRx !== true ||
						(bRx === true && gl.isRegExpValid(url)))
					{
						//Update it
						var objXcpt = arrExcpts[nInd];

						objXcpt.mt = url;
						objXcpt.rx = bRx;
						objXcpt.tp = nType;

						//Save settings
						gl.saveSettings();

						//Reload the list of exceptions
						if(!gl.xcptUpdateRow(nInd))
						{
							//Error
							gl.logError("[269] Row update failed, ind=" + nInd);
						}

					}
					else
					{
						//Bad exception
						console.error("[323] Bad exception regexp='" + url + "'");
					}
				}
				else
				{
					//Bad data
					console.error("[268] Bad exception data: url='" + url + "', tp=" + nType + ", ind=" + nInd + ", arrLn=" + arrExcpts.length);
				}
			}
			else if(res !== false)
			{
				//Error
				console.error("[266] Exception edit failed: " + res);
			}
		});
	},

	_onXcptAddEditException: function(url, rx, tp, nXcptInd)
	{
		//Method that will be called to do the checks when user clicks OK as such: callCheck(url, rx, tp, nXcptInd), where:
		//					url			= user's currently chosen URL
		//					rx			= 'true' if 'url' contains Regular Expressions, otherwise - if it's just a match string
		//					tp			= user's currently chosen exception type (see 'gSettings.arrExcepts')
		//					nXcptInd	= exception index in the global 'gSettings.arrExcepts' array, or null if it doesn't exist (like when adding new exception)
		//				This methos must return:
		//					true	= to allow the OK action, or
		//					String	= error message to display for a user (and not proceed with OK action)
		var res = null;

		//Get exception array
		var arrExcpts = gl.getSettingsRef().arrExcepts;

		//Format URL
		url = url ? url.trim().toLowerCase() : "";

		if(url)
		{
			//If it's a regexp, check it
			if(rx !== true ||
				(rx === true && gl.isRegExpValid(url)))
			{
				//Assume success
				res = true;

				//See if such URL already exists
				for(var i = 0; i < arrExcpts.length; i++)
				{
					//See if it matched and it's not our index
					if(nXcptInd != i &&
						arrExcpts[i].mt == url &&
						arrExcpts[i].tp == tp)
					{
						//Matched
						res = chrome.i18n.getMessage("err_xcpts_msg02");

						//Select it in the main list
						gl.xcptSelectRow(i, true, true);

						break;
					}
				}
			}
			else
			{
				//Invalid RegExp
				res = chrome.i18n.getMessage("err_xcpts_msg04");
			}
		}
		else
		{
			//URL is required
			res = chrome.i18n.getMessage("err_xcpts_msg01");
		}

		return res;
	},


	xcptShowEditWnd: function(nXcptInd, url, callCheck, callbackDone)
	{
		//Show a pop up window to edit/add exception
		//'nXcptInd' = index of exception to edit in the global 'gSettings.arrExcepts' array, or null for "add new" window
		//'url' = if adding exception, may point to the URL to use, or null for empty URL
		//'callCheck' = if used, is the method that will called to do the checks when user clicks OK as such: callCheck(url, rx, tp, nXcptInd), where:
		//					url			= user's currently chosen URL
		//					rx			= 'true' if 'url' contains Regular Expressions, otherwise - if it's just a match string
		//					tp			= user's currently chosen exception type (see 'gSettings.arrExcepts')
		//					nXcptInd	= exception index in the global 'gSettings.arrExcepts' array, or null if it doesn't exist (like when adding new exception)
		//				This methos must return:
		//					true	= to allow the OK action, or
		//					String	= error message to display for a user (and not proceed with OK action)
		//'callbackDone' = if used, must point to callback method that will be called with result as such: callbackDone(res) where 'res' can be:
		//					= [Object] with the following props if user OK'ed it:
		//								INFO: This data is not vetted!
		//								'ind'	= exception index in the global 'gSettings.arrExcepts' array, or null if it doesn't exist (like when adding new exception)
		//								'url'	= [string] exception URL, may be ""
		//								'rx'	= 'true' if 'url' contains Regular Expressions, otherwise - if it's just a match string
		//								'tp'	= [integer] type of exception (see 'gSettings.arrExcepts'), or NaN if error reading it off control
		//					= false if user canceled the window
		//					= null if error

		try
		{
			//Is it an edit?
			var bEdit = nXcptInd !== null;

			//Convert ID to interger
			nXcptInd = parseInt(nXcptInd, 10);

			//Get exception array
			var arrExcpts = gl.getSettingsRef().arrExcepts;

			var nSelType = 1;				//Exception type originally selected
			var bRx = false;				//true if 'url' contains RegExp

			var nPrevType = null;
			var strPrevURL = null;
			var bPrevRx = null;

			if(bEdit)
			{
				//Get exception URL
				if(nXcptInd >= 0 && nXcptInd < arrExcpts.length)
				{
					//	'mt'		= [string] match string, cannot be empty (always in lower case!)
					//	'rx'		= 'true' if 'mt' contains Regular Expressions, otherwise - if it's just a match string
					//	'tp'		= type of the match, one of:
					//				   INFO: We'll assume page URL is: http://www.slides.example.com:80/php/page.php?what=doc#print
					//					0	= full case-insensitive match of the entire URL
					//					1	= case-insensitive match of host name only (excluding www & port number), or: "slides.example.com"
					//					2	= case-insensitive match of host name only (excluding port number), or: "www.slides.example.com"
					//					3	= case-insensitive match of host name (excluding www & port number) + page only, or: "slides.example.com/php/page.php"
					//					4	= case-insensitive match of host name (excluding port number) + page only, or: "www.slides.example.com/php/page.php"
					url = arrExcpts[nXcptInd].mt;
					bRx = arrExcpts[nXcptInd].rx ? true : false;
					nSelType = arrExcpts[nXcptInd].tp;

					//Remember previous type and URL
					nPrevType = nSelType;
					strPrevURL = url;
					bPrevRx = bRx;
				}
				else
				{
					//Bad index
					console.error("[273] Bad index to edit=" + nXcptInd + ", arrLn=" + arrExcpts.length);

					//Treat as adding new item
					bEdit = false;
				}
			}

			//gl.encodeHtml(chrome.i18n.getMessage("msg_expMsg_message"))

			//Make safe URL for html
			var strUrlSafe = gl.encodeHtml(url);

			var nTimerErrMsg = null;

			//Set popup html body
			$('#dialog-xcpts-msgbdy').html('<fieldset><legend>' + gl.encodeHtml(chrome.i18n.getMessage("msg_lgndXcpts_Params")) + '</legend>' +
				'<div><input id="idXcptsSelUrl" type="text"' + 
				(url ? ' value="' + strUrlSafe + '"' : '') +
				'><a class="hdrLink" href="#" title="' + gl.encodeHtml(chrome.i18n.getMessage("prompt_OpenPage")) + 
				'" target="_blank"></a><span id="idXcptsMsg_dialog-confirm"></span></div>' +
				'<label class="smChkBx"><input id="chkUrlRegExp" type="checkbox" value="1">' + gl.encodeHtml(chrome.i18n.getMessage("xcptsUseRegExp")) + '</label>' +
				'<div><span>' + gl.encodeHtml(chrome.i18n.getMessage("xcptsSelType")) + '</span>' +
				'<select id="idXcptsSelType">' +
				'<option value="0"' + (nSelType == 0 ? ' selected' : '') + '>' + gl.encodeHtml(chrome.i18n.getMessage("sel_XcptsSelType_0")) + '</option>' +
				'<option value="1"' + (nSelType == 1 ? ' selected' : '') + '>' + gl.encodeHtml(chrome.i18n.getMessage("sel_XcptsSelType_1")) + '</option>' +
				'<option value="2"' + (nSelType == 2 ? ' selected' : '') + '>' + gl.encodeHtml(chrome.i18n.getMessage("sel_XcptsSelType_2")) + '</option>' +
				'<option value="3"' + (nSelType == 3 ? ' selected' : '') + '>' + gl.encodeHtml(chrome.i18n.getMessage("sel_XcptsSelType_3")) + '</option>' +
				'<option value="4"' + (nSelType == 4 ? ' selected' : '') + '>' + gl.encodeHtml(chrome.i18n.getMessage("sel_XcptsSelType_4")) + '</option>' +
				'</select><span id="idDescXcptsSelType" class="cmbDesc"></span><span class="cmbDesc">' + gl.encodeHtml(chrome.i18n.getMessage("msg_example")) + '</span>' +
				'<span class="cmbDesc indt1">' + gl.encodeHtml(chrome.i18n.getMessage("msg_lgndXcpts_msg01")) + '<span class="xcptDescExmp01" id="idXcptDescExmp"></span></span>' + 
				'<span class="cmbDesc indt1" id="idXcptDescMtchs"></span></div></fieldset>'
				);

			//Display a model window
			$( "#dialog-xcpts" ).dialog({
				resizable: false,
				height: 'auto',
				minWidth: 560,
				modal: true,
				title: chrome.i18n.getMessage(bEdit ? "msg_XcptEdit_title" : "msg_XcptAdd_title"),
				open: function(evt, ui)
				{
					//Event triggered when dialog is opened

					//Hide error
					$("#idXcptsMsg_dialog-confirm").hide();

					//Set initial description for combo selection
					gl.xcptUpdateXcptTypeDesc(parseInt($("#idXcptsSelType").val(), 10));

					//Set checkbox for "Use RegExp"
					$("#chkUrlRegExp").prop('checked', bRx ? true : false);

					//Set handler for URL buttons
					$(".hdrLink").click(function(evt)
					{
						//First prevent its propagation
						evt.stopPropagation();
						evt.preventDefault();

						//Only if not using RegExps
						if(!$("#chkUrlRegExp").prop('checked'))
						{
							//Open URL
							var strUrl = $("#idXcptsSelUrl").val();
							gl.openURL(strUrl);
						}
					});

					//Event when combo selection changes
					$("#idXcptsSelType").change(function(e)
					{
						//Selection changes
						
						//Get selected value in the drown-down box
						var nVal = parseInt($(this).val(), 10);

						//Get description
						gl.xcptUpdateXcptTypeDesc(nVal);
					});

					//Track the Enter key
					$("#idXcptsSelUrl").keypress(function(e)
					{
						//Make sure it's Enter
						if(e.keyCode == $.ui.keyCode.ENTER)
						{
							//Simulate click on OK button
							$("#idXcptBtnOkAdd").trigger("click");
						}
					});

				},
				buttons: [
				{
					text: chrome.i18n.getMessage(bEdit ? "btn_ok" : "btn_add"),
					id: "idXcptBtnOkAdd",
					click: function()
					{
						//OK/Add button clicked
						var strUrl = $("#idXcptsSelUrl").val();

						//Use RegExp?
						var bUseRegExp = $("#chkUrlRegExp").prop('checked') ? true : false;

						//Get type
						var tp = parseInt($("#idXcptsSelType").val(), 10);

						var resChk = null;

						//Find element index
						var ind = null;
						if(bEdit)
						{
							//Check that the original index still houses the same element
							if(nXcptInd >= 0 && nXcptInd < arrExcpts.length &&
								arrExcpts[nXcptInd].tp == nPrevType &&
								arrExcpts[nXcptInd].mt == strPrevURL &&
								arrExcpts[nXcptInd].rx == bPrevRx)
							{
								//Use it
								ind = nXcptInd;
							}
							else
							{
								//Exception was changed (from outside this edit window)
								resChk = chrome.i18n.getMessage("err_xcpts_msg03");
							}
						}
			
						if(!resChk)
						{
							//Do we have a callback to check
							//					true	= to allow the OK action, or
							//					String	= error message to display for a user (and not proceed with OK action)
							resChk = callCheck ? callCheck(strUrl, bUseRegExp, tp, ind) : true;
						}

						if(resChk === true)
						{
							//Close dialog
							$(this).dialog("close");

							//Report result
							if(callbackDone)
								callbackDone({
									ind: ind,
									url: strUrl ? strUrl : "",
									rx: bUseRegExp,
									tp: tp
								});
						}
						else
						{
							//Didn't pass the check

							//Clear previous timer
							if(nTimerErrMsg)
							{
								window.clearTimeout(nTimerErrMsg);
								nTimerErrMsg = null;
							}

							//Make error msg
							var strErrMsg = resChk ? resChk.toString() : "";
							if(!strErrMsg)
								strErrMsg = "[267] " + chrome.i18n.getMessage("msg_err_general");

							//Display error
							$("#idXcptsMsg_dialog-confirm").show();
							$("#idXcptsMsg_dialog-confirm").text(strErrMsg);
							nTimerErrMsg = window.setTimeout(function()
							{
								//Remove message
								nTimerErrMsg = null;
								$("#idXcptsMsg_dialog-confirm").hide();
								$("#idXcptsMsg_dialog-confirm").text("");

							}, 8000);

						}
					}
				},
				{
					text: chrome.i18n.getMessage("lnk_close"),
					click: function() 
					{
						//Close dialog
						$(this).dialog("close");

						//User canceled
						if(callbackDone)
							callbackDone(false);
					}
				}]
			});


		}
		catch(e)
		{
			//Exception
            gl.logExceptionReport(259, e);

			if(callbackDone)
				callbackDone(null);
		}
	},


	xcptUpdateXcptTypeDesc: function(nTp)
	{
		//Update exception description

		var res = gl.xcptGetXcptTypeDesc(nTp);

		//Get description text itself
		$('#idDescXcptsSelType').text(res.dsc);

		//Set example
		$('#idXcptDescExmp').text(res.exmpl);

		//Make matched URLs
		var strHtml = gl.encodeHtml(chrome.i18n.getMessage("msg_lgndXcpts_msg02"));		//The following web pages will match:

		for(var i = 0; i < res.urls.length; i++)
		{
			strHtml += '<span class="xcptDescExmp01 nln">' + res.urls[i] + '</span>';
		}

		//Set it
		$('#idXcptDescMtchs').html(strHtml);

	},


	xcptGetXcptTypeDesc: function(nTp)
	{
		//RETURN: Object with props:
		//			'dsc'		= Description text, or "" if error
		//			'exmpl'		= Example URL: "slides.example.com"
		//			'urls'		= Array with matching URLs (that must have matched sections marked with <em> and </em> tabs)
		var desc = "";
		var arrUrls = [];
		var exmpl = "";

		switch(nTp)
		{
		case 0:
			//					0	= full case-insensitive match of the entire URL
			desc = chrome.i18n.getMessage("desc_XcptsSelType_0");
			exmpl = "http://slides.example.com/php/page.php";
			arrUrls.push("<em>http://slides.example.com/php/page.php</em>");
			break;
		case 1:
			//					1	= case-insensitive match of host name only (excluding www & port number), or: "slides.example.com"
			desc = chrome.i18n.getMessage("desc_XcptsSelType_1");
			exmpl = "slides.example.com";
			arrUrls.push("https://www.<em>slides.example.com</em>");
			arrUrls.push("http://<em>slides.example.com</em>/php/page.php?what=doc#print");
			arrUrls.push("http://www.<em>slides.example.com</em>:80/php/page.php?what=doc#print");
			break;
		case 2:
			//					2	= case-insensitive match of host name only (excluding port number), or: "www.slides.example.com"
			desc = chrome.i18n.getMessage("desc_XcptsSelType_2");
			exmpl = "www.slides.example.com";
			arrUrls.push("https://<em>www.slides.example.com</em>");
			arrUrls.push("http://<em>www.slides.example.com</em>/php/page.php?what=doc#print");
			arrUrls.push("http://<em>www.slides.example.com</em>:80/php/page.php?what=doc#print");
			break;
		case 3:
			//					3	= case-insensitive match of host name (excluding www & port number) + page only, or: "slides.example.com/php/page.php"
			desc = chrome.i18n.getMessage("desc_XcptsSelType_3");
			exmpl = "slides.example.com/php/page.php";
			arrUrls.push("https://www.<em>slides.example.com/php/page.php</em>");
			arrUrls.push("http://<em>slides.example.com/php/page.php</em>?what=doc#print");
			arrUrls.push("http://www.<em>slides.example.com</em>:80<em>/php/page.php</em>?what=doc#print");
			break;
		case 4:
			//					4	= case-insensitive match of host name (excluding port number) + page only, or: "www.slides.example.com/php/page.php"
			desc = chrome.i18n.getMessage("desc_XcptsSelType_4");
			exmpl = "www.slides.example.com/php/page.php";
			arrUrls.push("https://<em>www.slides.example.com/php/page.php</em>");
			arrUrls.push("http://<em>www.slides.example.com/php/page.php</em>?what=doc#print");
			arrUrls.push("http://<em>www.slides.example.com</em>:80<em>/php/page.php</em>?what=doc#print");
			break;
		}

		return {
			dsc: desc,
			exmpl: exmpl,
			urls: arrUrls
		};
	},


	getExceptStrForType: function(xcpt)
	{
		//	'xcpt.tp'	= type of the match, one of:
		//				   INFO: We'll assume page URL is: http://www.slides.example.com:80/php/page.php?what=doc#print
		//					0	= full case-insensitive match of the entire URL
		//					1	= case-insensitive match of host name only (excluding www & port number), or: "slides.example.com"
		//					2	= case-insensitive match of host name only (excluding port number), or: "www.slides.example.com"
		//					3	= case-insensitive match of host name (excluding www & port number) + page only, or: "slides.example.com/php/page.php"
		//					4	= case-insensitive match of host name (excluding port number) + page only, or: "www.slides.example.com/php/page.php"
		//	'xcpt.rx'	= true if match refers to the RegExp
		//RETURN:
		//		= String for 'tp'
		//		= "" if error
		var str = "";

		switch(xcpt.tp)
		{
			case 0:
				str = gl.gSngltnPrmpts.strXcptsSelType_0;
				break;
			case 1:
				str = gl.gSngltnPrmpts.strXcptsSelType_1;
				break;
			case 2:
				str = gl.gSngltnPrmpts.strXcptsSelType_2;
				break;
			case 3:
				str = gl.gSngltnPrmpts.strXcptsSelType_3;
				break;
			case 4:
				str = gl.gSngltnPrmpts.strXcptsSelType_4;
				break;
		}

		if(str &&
			xcpt.rx === true)
		{
			//" (Uses RegExp)"
			str += gl.gSngltnPrmpts.strXcptsUsesRegExp;
		}

		return str;
	},



	onLinkClicked_ExportAllSettings: function()
	{
		//Command to export all settings
		try
		{
			//Get settings object as JSON (no extras)
			gl.getSettingsExport("sttgsObjExport", 0, false, function(strSttgs)
			{
				//	'strSttgs' =		[string] Special JSON for exported settings + other requested stuff
				//						null if error

				//Check for error
				if(strSttgs === null)
					strSttgs = "/*# ErrorCollecting #*/";

				//Set message html body
				$('#dialog-impexp-msgbdy').html('<span>' + gl.encodeHtml(chrome.i18n.getMessage("msg_expSttgsMsg_message")) +
					'</span><textarea readonly id="idTxtArea_dialog-confirm" class="exportTbx"></textarea>');
	
				//Display a model window
				$( "#dialog-impexp" ).dialog({
					resizable: false,
					height: 'auto',
					modal: true,
					title: chrome.i18n.getMessage("msg_expSttgsMsg_title"),
					open: function(evt, ui)
					{
						//Event triggered when dialog is opened

						$("#idTxtArea_dialog-confirm").val(strSttgs);
					},
					buttons: [
					{
						text: chrome.i18n.getMessage("lnk_copy"),
						click: function()
						{
							//Copy button
							gl.clipboardCopyText(strSttgs, true);
			
							//Close dialog
							$(this).dialog("close");
						}
					},
					{
						text: chrome.i18n.getMessage("lnk_close"),
						click: function() 
						{
							//Close dialog
							$(this).dialog("close");
						}
					}]
				});

			});
		}
		catch(e)
		{
            //Exception
            gl.logExceptionReport(277, e);
		}

	},


	onLinkClicked_ImportAllSettings: function()
	{
		//Command to import settings
		try
		{
			//Set message html body
			$('#dialog-impexp-msgbdy').html('<span>' + gl.encodeHtml(chrome.i18n.getMessage("msg_impSttgsMsg_message")) +
				'</span><textarea id="idTxtArea_dialog-confirm" class="exportTbx"></textarea>' +
				'<span id="idImpExpMsg_dialog-confirm"></span>');

			var nTimerErrMsg = null;
	
			//Display a model window
			$( "#dialog-impexp" ).dialog({
				resizable: false,
				height: 'auto',
				modal: true,
				title: chrome.i18n.getMessage("msg_impSttgsMsg_title"),
				open: function(evt, ui)
				{
					//Event triggered when dialog is opened

					$("#idTxtArea_dialog-confirm").val("");
				},
				buttons: [
				{
					text: chrome.i18n.getMessage("lnk_import"),
					click: function()
					{
						//Get data from the input control
						var strErrMsg = "";
						var strData = $("#idTxtArea_dialog-confirm").val();
						if(strData)
						{
							//Parse the data entered
							//		= Object with result, see props:
							//			'dta' = resulting data parsed, or null if error
							//			'ver' = version of the data being imported
							//			'dtExp' = string with local date/time when exported
							//			'err' = error description if any
							var objRes = gl.parseSettingsImport(strData);
							if(objRes.dta)
							{
								//Success
								$("#idImpExpMsg_dialog-confirm").text("");

								//Close dialog
								$(this).dialog("close");

								//Show prompt
								gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_impSttgsMsg_last_msg").
										replace("#V#", objRes.ver.trim()).
										replace("#D#", objRes.dtExp.trim()),
									chrome.i18n.getMessage("msg_impSttgsMsg_title"),
									chrome.i18n.getMessage("lnk_import"),		//"OK", 
									chrome.i18n.getMessage("lnk_close"),		//"Close",
									function(objImp)
									{
										//User chose to import

										//Get settings object
										var stngs = gl.getSettingsRef();

										//Make a copy of previous settings
										var prevStngs = $.extend(true, {}, stngs);

										//Set settings
										//////////////////////////////////////////////////
										gl.setSettingsObject(objImp.dta, true);
										stngs = objImp.dta;

										//And save it (don't show user message)
										gl.saveSettings(-1, function(resSv)
										{
											//					'true'	= saving success
											//					string	= if error saving

											//Get background page
											var bgPage = chrome.extension.getBackgroundPage();

											//See if we need to reset data collection flag
											if(!!stngs.bCollectData != !!prevStngs.bCollectData)
											{
												//Reset data collection
												bgPage.gl.enableDataCollection(stngs.bCollectData);
											}

											//We also need to update the main polling timers
											//INFO: Don't use a long delay in this case
											gl.resetMainDataCollectionTimer(1);
											gl.resetMainPersistDataSaveTimer(1);

											//Apply persistent storage type
											bgPage.gl.changePersistentStorageType(stngs.nPersistStorageType, function(resStg)
											{
												//						= 'true' if saved OK
												//						= Error description string, if failed to save
												if(resStg === true &&
													resSv === true)
												{
													//Show user message
													gl.setSavedResultTxt(3);

													gl.logReport("[280] Imported settings: verExported=" + objImp.ver + ", dateExported=" + objImp.dtExp);
												}
												else
												{
													//Show error
													gl.saveFailed();

													gl.logError("[280] Error importing settings: verExported=" + objImp.ver + ", dateExported=" + objImp.dtExp +
														", resSv=" + resSv + ", resStg=" + resStg);
												}

												//Also update this page
												gl.updateTabCtrls_Advanced();
											});
										});
									},
									objRes);
							}
							else
							{
								//Error parsing
								strErrMsg = objRes.err;
								if(!strErrMsg)
									strErrMsg = "[279] " + chrome.i18n.getMessage("msg_impMsg_err02");		//Parsing error
							}
						}
						else
						{
							//No data
							strErrMsg = chrome.i18n.getMessage("msg_impSttgsMsg_err01");
						}


						//Only if we have an error
						if(strErrMsg)
						{
							//Clear previous timer
							if(nTimerErrMsg)
							{
								window.clearTimeout(nTimerErrMsg);
								nTimerErrMsg = null;
							}

							//Display error
							$("#idImpExpMsg_dialog-confirm").show();
							$("#idImpExpMsg_dialog-confirm").text(strErrMsg);
							nTimerErrMsg = window.setTimeout(function()
							{
								//Remove message
								nTimerErrMsg = null;
								$("#idImpExpMsg_dialog-confirm").hide();
								$("#idImpExpMsg_dialog-confirm").text("");

							}, 5000);
						}
					}
				},
				{
					text: chrome.i18n.getMessage("lnk_close"),
					click: function() 
					{
						//Close dialog
						$(this).dialog("close");
					}
				}]
			});

		}
		catch(e)
		{
            //Exception
            gl.logExceptionReport(278, e);
		}
	},


	parseSettingsImport: function(strData)
	{
		//Import 'strData' settings data
		//RETURN:
		//		= Object with result, see props:
		//			'dta' = resulting data parsed & validated, or null if error
		//			'ver' = version of the data being imported
		//			'dtExp' = string with local date/time when exported
		//			'err' = error description if any
		var objData = null;
		var strErr = "";
		var strVer = "";
		var strDtExp = "";

		try
		{
			if(strData)
			{
				//Trim spaces on each end & convert to string
				strData = strData.toString().trim();

				//First get the stamp
				//			'stp' = Object with parsed stamp data, or null if error
				//			'jsn' = String with valid JSON from 'strData'
				var objStmp = gl.parseStorageImportStamp(strData, 'sttgsObjExport');
				if(objStmp.stp)
				{
					//Check version
					//		= 0 if both are the same
					//		= 1 if v1 > v2
					//		= -1 if v1 < v2
					//		= NaN if error
					var resVer = gl.compareVersions(gl.getThisAppVersion(), objStmp.stp.ver);
					if(resVer === 0 ||
						resVer === 1)
					{
						//Version is OK
						strVer = objStmp.stp.ver;

						//Get time exported
						strDtExp = gl.formatDateTimeFromTicks(gl.convertFromUTCTicks(objStmp.stp.dt));

						//Get background page ref
						var bgPage = chrome.extension.getBackgroundPage();

						//Now try to parse the data (ignore version)
						//		= object with data to use - if data was accepted
						//		= null if error in data
						objData = bgPage.gl.checkAndInstantiateObjSettings(objStmp.jsn ? JSON.parse(objStmp.jsn) : null);
						if(!objData)
						{
							//Error parsing
							strErr = "[286] " + chrome.i18n.getMessage("msg_impMsg_err02");		//Parsing error
						}
					}
					else
					{
						//Error
						if(resVer == -1)
						{
							//Cannot import from newer version: #V#. Update this app first.
							strErr = "[285] " + chrome.i18n.getMessage("msg_impMsg_err05").replace("#V#", objStmp.stp.ver);
						}
						else
						{
							//Bad version
							strErr = "[284] " + chrome.i18n.getMessage("msg_impMsg_err04") + ": " + objStmp.stp.ver;
						}
						
					}
				}
				else
					strErr = "[283] " + chrome.i18n.getMessage("msg_impMsg_err03");		//Bad data
			}
			else
				strErr = "[282] " + chrome.i18n.getMessage("msg_impMsg_err03");		//Bad data
		}
		catch(e)
		{
            //Exception
            gl.logExceptionReport(287, e);

			objData = null;
			strErr = "[281] " + chrome.i18n.getMessage("msg_impMsg_err02");		//Parsing error
		}

		return {
			dta: objData,
			ver: strVer,
			dtExp: strDtExp,
			err: strErr
		};
	},




	updateTabCtrls_Advanced: function()
	{
		//Update controls on the Advanced page

		//Get settings object
		var stngs = gl.getSettingsRef();

		//Copy to clipboard options
		$("#idCopyTxtOpt").val(stngs.nCopySubstNewLines.toString());


		//Set storage sliders
        var objSliderDataColFreq = document.getElementById("idRangeDataColFreq");
        var objSliderPersistSaveFreq = document.getElementById("idRangePersistSaveFreq");

		//Set sliders
		objSliderDataColFreq.value = stngs.nCollectFormDataFreqMs;
		objSliderPersistSaveFreq.value = stngs.nSavePersistDataFreqMs;

		//Set number values
		$("#idSldrDataColFreq").text(stngs.nCollectFormDataFreqMs.toString() + " " + chrome.i18n.getMessage("abbrv_ms"));
		gl.formatMinSecField("#idSldrPersistSaveFreq", stngs.nSavePersistDataFreqMs);


		//Set checkboxes
		// 0x10000 =	if ID and NAME of html element must be defined for it to be collected
		$("#chkIdAndNm").prop('checked', !!(stngs.nCollectFlgs & 0x10000));

		$("#chkUseNtvScrlBrs").prop('checked', stngs.bUseNativeScrollbars);

	},


	onSliderPosChanged_DataColFreq: function(elmt)
	{
		//Called when slider is dragged to a new position
		//'elmt' = slider DOM element
		var nPos = parseInt(elmt.value, 10);

		//Set number value
		$("#idSldrDataColFreq").text(nPos.toString() + " " + chrome.i18n.getMessage("abbrv_ms"));

		//Get min/max values
		var objMinMax = gl.getMinMaxSettingsVals();

		//Make sure that we're within limits
		if(nPos >= objMinMax.nCollectFormDataFreqMs.min &&
			nPos <= objMinMax.nCollectFormDataFreqMs.max)
		{
			//Set settings value
			gl.getSettingsRef().nCollectFormDataFreqMs = nPos;
			gl.saveSettings();

			//At this point we need to update the main polling timer
			//INFO: To save on CPU cycles do so only after a delay
			gl.resetMainDataCollectionTimer(1000);		//1 sec
		}
		else
		{
			//Otherwise failed
			gl.saveFailed();
		}
	},


	resetMainDataCollectionTimer: function(msDelay)
	{
		//Reset the main data collection/polling timer after a delay
		//'msDelay' = delay in ms

		//Remove old time-out if still going
		if(gl.__gnTimerUpdtMainPollTmr)
		{
			window.clearTimeout(gl.__gnTimerUpdtMainPollTmr);
			gl.__gnTimerUpdtMainPollTmr = null;
		}

		//Start after a delay
		gl.__gnTimerUpdtMainPollTmr = window.setTimeout(function()
		{
			//Now we can reset the main timer
			var bgPage = chrome.extension.getBackgroundPage();
			bgPage.gl.setTimer_FormDataCollection();

		}, 
		msDelay ? msDelay : 0);
	},
	__gnTimerUpdtMainPollTmr: null,		//[Internal use]



	onButtonLess_DataColFreq: function(elmt)
	{
		//Called when "Less" button was clicked
		//'elmt' = button DOM element

		//Get slider
        var objSlider = document.getElementById("idRangeDataColFreq");

		var nPos = parseInt(objSlider.value, 10);

		nPos -= gl.gnAdvSldrFreqGradBtn_DataColFreq;
		nPos /= gl.gnAdvSldrFreqGradBtn_DataColFreq;
		nPos = Math.round(nPos);		//Convert to int
		nPos *= gl.gnAdvSldrFreqGradBtn_DataColFreq;

		if(nPos < objSlider.min)
			nPos = objSlider.min;

		//Set new pos
		objSlider.value = nPos;

		//Process value change
		gl.onSliderPosChanged_DataColFreq(objSlider);
	},

	onButtonMore_DataColFreq: function(elmt)
	{
		//Called when "More" button was clicked
		//'elmt' = button DOM element

		//Get slider
        var objSlider = document.getElementById("idRangeDataColFreq");

		var nPos = parseInt(objSlider.value, 10);

		nPos += gl.gnAdvSldrFreqGradBtn_DataColFreq;
		nPos /= gl.gnAdvSldrFreqGradBtn_DataColFreq;
		nPos = Math.round(nPos);		//Convert to int
		nPos *= gl.gnAdvSldrFreqGradBtn_DataColFreq;

		if(nPos > objSlider.max)
			nPos = objSlider.max;

		//Set new pos
		objSlider.value = nPos;

		//Process value change
		gl.onSliderPosChanged_DataColFreq(objSlider);
	},


	formatMinSecField: function(idTxt, msDuration)
	{
		//Set span with 'idTxt' to duation from 'msDuration' -- example: "4m 3s"
		//'msDuration' = duration is ms

		//First convert to seconds
		var nSecs = Math.round(msDuration / 1000);

		//Get min & sec parts
		var nM = nSecs / 60;
		nM = ~~nM;
		var nS = nSecs % 60;

		//Make up a value
		var bUseSecs = true;
		var str = "";
		if(nM > 0)
		{
			str = nM.toString() + " " + chrome.i18n.getMessage("abbrv_min");

			if(nS)
			{
				str += " : ";
			}
			else
			{
				bUseSecs = false;
			}
		}

		if(bUseSecs)
		{
			//Add seconds
			str += nS.toString() + " " + chrome.i18n.getMessage("abbrv_sec");
		}

		//Set it
		$(idTxt).text(str);
	},

	onSliderPosChanged_PersistSaveFreq: function(elmt)
	{
		//Called when slider is dragged to a new position
		//'elmt' = slider DOM element
		var nPos = parseInt(elmt.value, 10);

		//Set number value
		gl.formatMinSecField("#idSldrPersistSaveFreq", nPos);

		//Get min/max values
		var objMinMax = gl.getMinMaxSettingsVals();

		//Make sure that we're within limits
		if(nPos >= objMinMax.nSavePersistDataFreqMs.min &&
			nPos <= objMinMax.nSavePersistDataFreqMs.max)
		{
			//Set settings value
			gl.getSettingsRef().nSavePersistDataFreqMs = nPos;
			gl.saveSettings();

			//At this point we need to update the main polling timer
			//INFO: To save on CPU cycles do so only after a delay
			gl.resetMainPersistDataSaveTimer(1000);		//1 sec
		}
		else
		{
			//Otherwise failed
			gl.saveFailed();
		}
	},

	resetMainPersistDataSaveTimer: function(msDelay)
	{
		//Reset the main persistent data saving timer after a delay
		//'msDelay' = delay in ms

		//Remove old time-out if still going
		if(gl.__gnTimerSavePrstsStg)
		{
			window.clearTimeout(gl.__gnTimerSavePrstsStg);
			gl.__gnTimerSavePrstsStg = null;
		}

		//Start after a delay
		gl.__gnTimerSavePrstsStg = window.setTimeout(function()
		{
			//Now we can reset the main timer
			var bgPage = chrome.extension.getBackgroundPage();
			bgPage.gl.setTimer_PersistDataSave();

		}, 
		msDelay ? msDelay : 0);
	},
	__gnTimerSavePrstsStg: null,		//[Internal use]


	onButtonLess_PersistSaveFreq: function(elmt)
	{
		//Called when "Less" button was clicked
		//'elmt' = button DOM element

		//Get slider
        var objSlider = document.getElementById("idRangePersistSaveFreq");

		var nPos = parseInt(objSlider.value, 10);

		nPos -= gl.gnAdvSldrFreqGradBtn_PersistSaveFreq;
		nPos /= gl.gnAdvSldrFreqGradBtn_PersistSaveFreq;
		nPos = Math.round(nPos);		//Convert to int
		nPos *= gl.gnAdvSldrFreqGradBtn_PersistSaveFreq;

		if(nPos < objSlider.min)
			nPos = objSlider.min;

		//Set new pos
		objSlider.value = nPos;

		//Process value change
		gl.onSliderPosChanged_PersistSaveFreq(objSlider);
	},

	onButtonMore_PersistSaveFreq: function(elmt)
	{
		//Called when "More" button was clicked
		//'elmt' = button DOM element

		//Get slider
        var objSlider = document.getElementById("idRangePersistSaveFreq");

		var nPos = parseInt(objSlider.value, 10);

		nPos += gl.gnAdvSldrFreqGradBtn_PersistSaveFreq;
		nPos /= gl.gnAdvSldrFreqGradBtn_PersistSaveFreq;
		nPos = Math.round(nPos);		//Convert to int
		nPos *= gl.gnAdvSldrFreqGradBtn_PersistSaveFreq;

		if(nPos > objSlider.max)
			nPos = objSlider.max;

		//Set new pos
		objSlider.value = nPos;

		//Process value change
		gl.onSliderPosChanged_PersistSaveFreq(objSlider);
	},





	updateAfterViewMxdChange: function(nViewIncog)
	{
		//'nViewIncog' = How to view mixed data from "Incognito" and regular tabs:
		//	0 = allow viewing mixed data
		//	1 = allow to view mixed data only in Incognito mode
		//	2 = do not allow viewing mixed data
		//RETURN:
		//		= true if value was accepted
		var res = true;

		var txtId;
		switch(nViewIncog)
		{
			case 0:
				txtId = "desc_cmbDropDwn_v0";
				break;
			case 1:
				txtId = "desc_cmbDropDwn_v1";
				break;
			case 2:
				txtId = "desc_cmbDropDwn_v2";
				break;
			default:
				res = false;
				txtId = null;
				console.error("[201] Bad type=" + nViewIncog);
				break;
		}

		//Set descr
		$("#idDescViewMxd").text(txtId ? chrome.i18n.getMessage(txtId) : "");

		return res;
	},

	onCheckboxChange_CollectFlgs: function(stngs, bNowChecked, nFlag)
	{
		//Called when "Collect data from..." specific checkbox check is changed
		if(bNowChecked)
			stngs.nCollectFlgs |= nFlag;
		else
			stngs.nCollectFlgs &= ~nFlag;

		gl.saveSettings();
	},


	onCheckboxChange: function(chkBox)
	{
		//Called when a checkbox on any tab is checked or unchecked by a user
		//'chkBox' = checkbox jQuery element

		//Get checkbox id & checked state
		var strID = chkBox.id;
		var bNowChecked = chkBox.checked ? true : false;

		//Get settings object
		var stngs = gl.getSettingsRef();

		//Go depending on check ID
		switch(strID)
		{
			case 'chkCollectData':
			{
				//Checkbox to "Collect all data" is checked/unchecked
				gl.enableGeneralTabCtrls(bNowChecked);

				//Set it in settings & do updates
				var bgPage = chrome.extension.getBackgroundPage();
				bgPage.gl.enableDataCollection(bNowChecked);

				//And show user message
				gl.setSavedResultTxt(1);
			}
			break;
			
			// 0x1 =		collect textarea
			// 0x2 =		collect "contentEditable" html elements (and treat them as textarea in our "popup" window)
			// 0x4 =		collect input: text
			// 0x8 =		collect input: email
			// 0x10 =		collect input: number
			// 0x20 =		collect input: search
			// 0x40 =		collect input: tel
			// 0x80 =		collect input: url
			// 0x20000 =	collect data from elements that are marked for "autocomplete off"
			case 'chkSingleLine':
			{
				gl.onCheckboxChange_CollectFlgs(stngs, bNowChecked, 0x4);
			}
			break;
			case 'chkMultiLine':
			{
				gl.onCheckboxChange_CollectFlgs(stngs, bNowChecked, 0x1);
			}
			break;
			case 'chkFmtInput':
			{
				gl.onCheckboxChange_CollectFlgs(stngs, bNowChecked, 0x2);
			}
			break;
			case 'chkNumberTbxs':
			{
				gl.onCheckboxChange_CollectFlgs(stngs, bNowChecked, 0x10);
			}
			break;
			case 'chkSearchTbxs':
			{
				gl.onCheckboxChange_CollectFlgs(stngs, bNowChecked, 0x20);
			}
			break;
			case 'chkURLTbxs':
			{
				gl.onCheckboxChange_CollectFlgs(stngs, bNowChecked, 0x80);
			}
			break;
			case 'chkEmailTbxs':
			{
				gl.onCheckboxChange_CollectFlgs(stngs, bNowChecked, 0x8);
			}
			break;
			case 'chkTelTbxs':
			{
				gl.onCheckboxChange_CollectFlgs(stngs, bNowChecked, 0x40);
			}
			break;
			case 'chkColAutocmplt':
			{
				gl.onCheckboxChange_CollectFlgs(stngs, bNowChecked, 0x20000);
			}
			break;

			case 'chkCollectFromIncog':
			{
				stngs.bIncogCollectData = bNowChecked;
				gl.saveSettings();
			}
			break;

			case 'chkSaveIncogData':
			{
				stngs.bIncogSavePersistStorage = bNowChecked;
				gl.saveSettings();
			}
			break;

			case 'chkIdAndNm':
			{
				// 0x10000 =	if ID and NAME of html element must be defined for it to be collected
				if(bNowChecked)
					stngs.nCollectFlgs |= 0x10000;
				else
					stngs.nCollectFlgs &= ~0x10000;

				gl.saveSettings();
			}
			break;

			case 'chkUseNtvScrlBrs':
			{
				stngs.bUseNativeScrollbars = bNowChecked;
				gl.saveSettings();
			}
			break;

			case 'chkXcptsHdrAll':
			{
				//(Un-)Check all checks in Exceptions list
				$(".chkXcptLn").each(function()
				{
					this.checked = bNowChecked;
				});

				//Update links/controls below the list
				gl.xcptUpdateLnkCtrls();
			}
			break;

			default:
			{
				//Unsupported
				console.error("[206] Unsupported id=" + strID);
			}
			break;
		}
	},

	onRadioboxChange: function(radBox)
	{
		//Called when a radio box on any tab is checked or unchecked by a user
		//'radBox' = radio box jQuery element

		//Get checkbox id & checked state
		var strID = radBox.id;
		var bNowChecked = radBox.checked ? true : false;

		//console.log("Radio checked, id=" + strID + ", checked=" + bNowChecked);

		//Only if checked
		if(bNowChecked)
		{
			switch(strID)
			{
				case 'radStgTypeNone':
				{
					gl.onChangePersistentStorageType(0);
				}
				break;

				case 'radStgTypeLocalStorage':
				{
					gl.onChangePersistentStorageType(1);
				}
				break;

				case 'radStgTypeChromeLocal':
				{
					gl.onChangePersistentStorageType(2);
				}
				break;

				default:
				{
					//Unsupported
					console.error("[230] Unsupported id=" + strID);
				}
				break;
			}
		}
		else
		{
			//Error
			console.error("[229] Unsupported radio box state, id=" + strID + ", checked=" + bNowChecked);
		}
	},

	onLinkClicked: function(link, evt)
	{
		//Called when a special link is clicked on the page
		//'link' = link object that was clicked

		//First prevent its propagation
		evt.stopPropagation();
		evt.preventDefault();

		//Get its ID
		var id = link.id;

		switch(id)
		{
			case 'idLnkExportAll':
			{
				gl.onLinkClicked_ExportAllData();
			}
			break;

			case 'idLnkImportAll':
			{
				gl.onLinkClicked_ImportAllData();
			}
			break;

			case 'idLnkClearAll':
			{
				gl.onRemoveAll();
			}
			break;

			case 'idLnkClearIncog':
			{
				gl.onRemoveAll_Incognito();
			}
			break;

			case 'idLnkApplyChngs':
			{
				gl.onApplyChanges_Memory();
			}
			break;

			case 'idLnkXcptsEdit':
			{
				gl.onXcptEdit();
			}
			break;

			case 'idLnkXcptsRemove':
			{
				gl.onXcptRemove();
			}
			break;

			case 'idLnkXcptsAddNew':
			{
				gl.onXcptAddNew();
			}
			break;

			case 'idLnkXcptsAddCurrent':
			{
				gl.onXcptAddLastVisited();
			}
			break;

			case 'idLnkExportSttgsAll':
			{
				gl.onLinkClicked_ExportAllSettings();
			}
			break;

			case 'idLnkImportSttgsAll':
			{
				gl.onLinkClicked_ImportAllSettings();
			}
			break;

			default:
			{
				console.error("[213] Unprocessed link clicked, id=" + id);
			}
			break;
		}
	},


	onChangePersistentStorageType: function(nNewStgType, callbackDone)
	{
		//Change persistent storage type to 'nNewStgType'
		//'nNewStgType' = one of:
		//	0 = not to store in persistent storage (use browser's memory only)
		//	1 = localStorage
		//	2 = chrome.storage.local
		//'callbackDone' = if specified, is called when done processing this function. It is called as such: callbackDone(res) where, res is one of:
		//						= 'true' if saved OK
		//						= Error description string, if failed to save

		//Request background.js to do the work
		var bgPage = chrome.extension.getBackgroundPage();
		bgPage.gl.changePersistentStorageType(nNewStgType, function(res)
		{
			//Check result
			if(res === true)
			{
				//Set user message
				gl.setSavedResultTxt(1);
			}
			else
			{
				//Error
				gl.logError("[238] Error changing stg type: " + res);

				//Show user message
				gl.saveFailed();
			}

			//Also update usage bar (and show/hide footer message)
			gl.updateStorageUsageBar(true);

			//Call the callback method
			if(callbackDone)
				callbackDone(res);
		});

	},


	onRemoveAll: function()
	{
		//Remove all data

		//Show user warning
		gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_removeAll_message"),		//msg
			chrome.i18n.getMessage("msg_removeAll_title"),		//title
			chrome.i18n.getMessage("btn_remove"),		//btn OK
			chrome.i18n.getMessage("btn_cancel"),		//btn Close
			function()
			{
				//User chose to delete

				//Get storage object & count records in it
				var oStorage = gl.getStorageRef();
				var nCntRecs = Object.keys(oStorage).length;

				//Set empty storage object
				var objEmpty = {};

				//Then save it
				gl.setStorageObject(objEmpty);

				//For "good measure" manually clear the persistent storage
				gl.clearAllPersistentStorage(null, function(res)
				{
					//Only if success
					if(res === true)
					{
						//Set user message
						gl.setSavedResultTxt(2);

						//Log report
						gl.logReport("[226] Removed all " + nCntRecs + " record(s) of storage data");
					}
					else
					{
						//Error
						gl.logError("[237] Error removing all records: " + res);

						//Show user message
						gl.saveFailed();
					}

					//Also update usage bar
					gl.updateStorageUsageBar();

				});
			});
	},


	onRemoveAll_Incognito: function()
	{
		//Remove all data collected from Incognito tabs

		//Show user warning
		gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_removeAll_Incog_message"),		//msg
			chrome.i18n.getMessage("msg_removeAll_title"),		//title
			chrome.i18n.getMessage("btn_remove"),		//btn OK
			chrome.i18n.getMessage("btn_cancel"),		//btn Close
			function()
			{
				//User chose to delete

				//Get storage object
				var oStorage = gl.getStorageRef();

				//Look through all items
				var arrRemUrls = [];
				for(var pageUrl in oStorage)
				{
					//Is it incog data
					if(oStorage[pageUrl].flg & 0x2)			//0x2 =	set if page data came from "Incognito" tab
					{
						//Add it for removal
						arrRemUrls.push(pageUrl);
					}
				}

				//Now do the actual removal
				for(var i = 0; i < arrRemUrls.length; i++)
				{
					delete oStorage[arrRemUrls[i]];
				}

				//Then save it
				gl.setStorageObject(oStorage);

				//Also update usage bar
				gl.updateStorageUsageBar();

				//Set user message
				gl.setSavedResultTxt(2);

				//Log report
				gl.logReport("[227] Removed " + arrRemUrls.length + " incognito record(s) from storage data");

			});
	},


	onLinkClicked_ExportAllData: function()
	{
		//Command to export all collected data
		try
		{
			//Get all collected data
			var oStorage = gl.getStorageRef();

			//Initial message is empty
			var strStorage = "";

			//Set message html body
			$('#dialog-impexp-msgbdy').html('<span>' + gl.encodeHtml(chrome.i18n.getMessage("msg_expMsg_message")) +
				'</span><img id="idSpnr_dialog-confirm" draggable="false" src="images/spnr.gif" class="spnrExport" />' + 
				'<textarea readonly id="idTxtArea_dialog-confirm" class="taExport exportTbx"></textarea>');
	
			//Display a model window
			$( "#dialog-impexp" ).dialog({
				resizable: false,
				height: 'auto',
				modal: true,
				title: chrome.i18n.getMessage("msg_expMsg_title"),
				open: function(evt, ui)
				{
					//Event triggered when dialog is opened

					$("#idTxtArea_dialog-confirm").val("");
				},
				buttons: [
				{
					text: chrome.i18n.getMessage("lnk_copy"),
					click: function()
					{
						//Only if we have something
						if(strStorage)
						{
							//Copy button
							gl.clipboardCopyText(strStorage, true);
			
							//Close dialog
							$(this).dialog("close");
						}
					}
				},
				{
					text: chrome.i18n.getMessage("lnk_close"),
					click: function() 
					{
						//Close dialog
						$(this).dialog("close");
					}
				}]
			});

			//Begin exporting (need to do it after the modal dialog is shown because exporting may take a short while)
			window.setTimeout(function()
			{
				//Convert it to JSON
				strStorage = JSON.stringify(oStorage);

				//First hide the spinner & show the text area
				$("#idSpnr_dialog-confirm").hide();
				$("#idTxtArea_dialog-confirm").show();

				//Add comment to the beginning with what version and when saved
				var strHeader = '/*##[ %nm%="' + gl.getThisAppName() + '"; %tp%="dataObjExport"; %ver%="' + gl.getThisAppVersion() + '"; %dt%="' + gl.getCurrentTimeUTC() + '"; ]##*/\n';
				strStorage = strHeader + strStorage;

				//And set it
				$("#idTxtArea_dialog-confirm").val(strStorage);

			}, 200);

		}
		catch(e)
		{
            //Exception
            gl.logExceptionReport(214, e);
		}

	},


	onLinkClicked_ImportAllData: function()
	{
		//Command to import data
		try
		{
			//Set message html body
			$('#dialog-impexp-msgbdy').html('<span>' + gl.encodeHtml(chrome.i18n.getMessage("msg_impMsg_message")) +
				'</span><textarea id="idTxtArea_dialog-confirm" class="exportTbx"></textarea>' +
				'<span id="idImgMsg_dialog-confirm"></span>');

			var nTimerErrMsg = null;
	
			//Display a model window
			$( "#dialog-impexp" ).dialog({
				resizable: false,
				height: 'auto',
				modal: true,
				title: chrome.i18n.getMessage("msg_impMsg_title"),
				open: function(evt, ui)
				{
					//Event triggered when dialog is opened

					$("#idTxtArea_dialog-confirm").val("");
				},
				buttons: [
				{
					text: chrome.i18n.getMessage("lnk_import"),
					click: function()
					{
						//Get data from the input control
						var strErrMsg = "";
						var strData = $("#idTxtArea_dialog-confirm").val();
						if(strData)
						{
							//Parse the data entered
							//		= Object with result, see props:
							//			'dta' = resulting data parsed, or null if error
							//			'ver' = version of the data being imported
							//			'dtExp' = string with local date/time when exported
							//			'err' = error description if any
							var objRes = gl.parseStorageImport(strData);
							if(objRes.dta)
							{
								//Success
								$("#idImgMsg_dialog-confirm").text("");

								//Close dialog
								$(this).dialog("close");

								//Show prompt
								gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_impMsg_last_msg").
										replace("#V#", objRes.ver.trim()).
										replace("#D#", objRes.dtExp.trim()).
										replace("#P#", Object.keys(objRes.dta).length), 
									chrome.i18n.getMessage("msg_impMsg_title"),
									chrome.i18n.getMessage("lnk_import"),		//"OK", 
									chrome.i18n.getMessage("lnk_close"),		//"Close",
									function(objImp)
									{
										//See user chose to import
										//'objImp' = object with data to import
										gl.setStorageObject(objImp.dta);

										//Show user message
										gl.setSavedResultTxt(3);

										//Also update this page
										gl.updateTabCtrls_Memory();

										gl.logReport("[225] Imported storage data: verExported=" + objImp.ver + ", dateExported=" + objImp.dtExp + ", pages=" + Object.keys(objImp.dta).length);
									},
									objRes);
							}
							else
							{
								//Error parsing
								strErrMsg = objRes.err;
								if(!strErrMsg)
									strErrMsg = "[223] " + chrome.i18n.getMessage("msg_impMsg_err02");		//Parsing error
							}
						}
						else
						{
							//No data
							strErrMsg = chrome.i18n.getMessage("msg_impMsg_err01");
						}


						//Only if we have an error
						if(strErrMsg)
						{
							//Clear previous timer
							if(nTimerErrMsg)
							{
								window.clearTimeout(nTimerErrMsg);
								nTimerErrMsg = null;
							}

							//Display error
							$("#idImgMsg_dialog-confirm").show();
							$("#idImgMsg_dialog-confirm").text(strErrMsg);
							nTimerErrMsg = window.setTimeout(function()
							{
								//Remove message
								nTimerErrMsg = null;
								$("#idImgMsg_dialog-confirm").hide();
								$("#idImgMsg_dialog-confirm").text("");

							}, 5000);
						}
					}
				},
				{
					text: chrome.i18n.getMessage("lnk_close"),
					click: function() 
					{
						//Close dialog
						$(this).dialog("close");
					}
				}]
			});

		}
		catch(e)
		{
            //Exception
            gl.logExceptionReport(216, e);
		}
	},


	parseStorageImport: function(strData)
	{
		//Import 'strData' data
		//RETURN:
		//		= Object with result, see props:
		//			'dta' = resulting data parsed & validated, or null if error
		//			'ver' = version of the data being imported
		//			'dtExp' = string with local date/time when exported
		//			'err' = error description if any
		var objData = null;
		var strErr = "";
		var strVer = "";
		var strDtExp = "";

		try
		{
			if(strData)
			{
				//Trim spaces on each end & convert to string
				strData = strData.toString().trim();

				//First get the stamp
				//			'stp' = Object with parsed stamp data, or null if error
				//			'jsn' = String with valid JSON from 'strData'
				var objStmp = gl.parseStorageImportStamp(strData, 'dataObjExport');
				if(objStmp.stp)
				{
					//Check version
					//		= 0 if both are the same
					//		= 1 if v1 > v2
					//		= -1 if v1 < v2
					//		= NaN if error
					var resVer = gl.compareVersions(gl.getThisAppVersion(), objStmp.stp.ver);
					if(resVer === 0 ||
						resVer === 1)
					{
						//Version is OK
						strVer = objStmp.stp.ver;

						//Get time exported
						strDtExp = gl.formatDateTimeFromTicks(gl.convertFromUTCTicks(objStmp.stp.dt));

						//Get background page ref
						var bgPage = chrome.extension.getBackgroundPage();

						//Now try to parse the data (ignore version)
						//		= object with data to use - if data was accepted
						//		= null if error in data
						objData = bgPage.gl.checkAndInstantiateObjStorage(objStmp.jsn, true, true);
						if(!objData)
						{
							//Error parsing
							strErr = "[224] " + chrome.i18n.getMessage("msg_impMsg_err02");		//Parsing error
						}
					}
					else
					{
						//Error
						if(resVer == -1)
						{
							//Cannot import from newer version: #V#. Update this app first.
							strErr = "[220] " + chrome.i18n.getMessage("msg_impMsg_err05").replace("#V#", objStmp.stp.ver);
						}
						else
						{
							//Bad version
							strErr = "[219] " + chrome.i18n.getMessage("msg_impMsg_err04") + ": " + objStmp.stp.ver;
						}
						
					}
				}
				else
					strErr = "[218] " + chrome.i18n.getMessage("msg_impMsg_err03");		//Bad data
			}
			else
				strErr = "[217] " + chrome.i18n.getMessage("msg_impMsg_err03");		//Bad data
		}
		catch(e)
		{
            //Exception
            gl.logExceptionReport(221, e);

			objData = null;
			strErr = "[222] " + chrome.i18n.getMessage("msg_impMsg_err02");		//Parsing error
		}

		return {
			dta: objData,
			ver: strVer,
			dtExp: strDtExp,
			err: strErr
		};
	},

	parseStorageImportStamp: function(strData, strDataID)
	{
		//Parse data from 'strData' regarding import stamp
		//'strDataID' = data ID string
		//RETURN:
		//		= Object with the following props:
		//			'stp' = Object with parsed stamp data, or null if error
		//			'jsn' = String with valid JSON from 'strData'
		var objRes = null;
		var strJsn = "";

		if(strData)
		{
			//   /*##[ %nm%="Formalizr"; %tp%="dataObjExport"; %ver%="1.0.0.0"; %dt%="1411286420153"; ]##*/
			if(strData.indexOf("/*##[") === 0)
			{
				var nIndEnd = strData.indexOf("]##*/");
				if(nIndEnd > 0)
				{
					//Get stamp
					var stmp = strData.substr(5, nIndEnd - 5);
					if(stmp)
					{
						//Assume we're going to get something
						objRes = {};

						//Split
						var arrItms = stmp.split(";");

						for(var i = 0; i < arrItms.length; i++)
						{
							var strItm = arrItms[i].trim();		//%tp%="dataObjExport"
							if(strItm)
							{
								var arrPrts = strItm.split("=");
								if(arrPrts.length == 2)
								{
									//Get name & value
									var nm = arrPrts[0].trim();
									var val = arrPrts[1].trim();

									if(nm && val)
									{
										//Trim name
										if(nm[0] == '%' &&
											nm.length > 2 &&
											nm[nm.length - 1] == '%')
										{
											//Adjust name
											nm = nm.substr(1, nm.length - 2);

											//Remove quotes
											if(val[0] == '"' &&
												val.length >= 2 &&
												val[val.length - 1] == '"')
											{
												val = val.substr(1, val.length - 2);
											}

											//Add items
											objRes[nm] = val;
										}
										else
										{
											//Bad data
											return null;
										}
									}
									else
									{
										//Bad data
										return null;
									}
								}
								else
								{
									//Bad data
									return null;
								}
							}
						}

						//Update JSON
						nIndEnd += 5;
						strJsn = strData.substr(nIndEnd, strData.length - nIndEnd).trim();
					}
				}
			}
		}

		//Did we get data?
		if(objRes)
		{
			//Check that we've got our properties
			//   /*##[ %nm%="Formalizr"; %tp%="dataObjExport"; %ver%="1.0.0.0"; %dt%="1411286420153"; ]##*/
			if(objRes.nm != gl.getThisAppName() ||
				objRes.tp != strDataID ||
				!objRes.ver ||
				!objRes.dt ||
				!gl.isInt(objRes.dt))
			{
				//Bad object
				objRes = null;
			}
		}

		return {
			stp: objRes,
			jsn: strJsn
		};
	},



	resetToDefaults_General: function()
	{
		//Reset data on the "General" tab to defaults

		//Show warning
		gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_reset_defaults"), 
			chrome.i18n.getMessage("msg_title_reset_defaults"), 
			chrome.i18n.getMessage("btn_reset"), 
			chrome.i18n.getMessage("btn_cancel"),
			function()
			{
				//User chose to reset the page

				//Get reference to default settings & actual settings
				var defSttgs = gl.getDefaultSettingsRef();
				var stngs = gl.getSettingsRef();

				//Apply values
				stngs.nCollectFlgs = defSttgs.nCollectFlgs;

				//See if we need to reset data collection flag
				if(!!stngs.bCollectData != !!defSttgs.bCollectData)
				{
					//Reset data collection
					var bgPage = chrome.extension.getBackgroundPage();
					bgPage.gl.enableDataCollection(defSttgs.bCollectData);
				}

				//Set controls by updating the tab
				gl.updateTabCtrls_General();

				//Then save it
				gl.saveSettings();
			});
	},


	resetToDefaults_Memory: function()
	{
		//Reset data on the "Memory" tab to defaults

		//Show warning
		gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_reset_defaults"), 
			chrome.i18n.getMessage("msg_title_reset_defaults"), 
			chrome.i18n.getMessage("btn_reset"), 
			chrome.i18n.getMessage("btn_cancel"),
			function()
			{
				//User chose to reset the page

				//Get reference to default settings & actual settings
				var defSttgs = gl.getDefaultSettingsRef();
				var stngs = gl.getSettingsRef();

				//Apply values
				stngs.nMaxPageNum = defSttgs.nMaxPageNum;
				stngs.nMaxTxBxNum = defSttgs.nMaxTxBxNum;
				stngs.nMaxTxtValNum = defSttgs.nMaxTxtValNum;

				//Set controls by updating the tab
				gl.updateTabCtrls_Memory();

				//Then save it
				gl.saveSettings();
			});
	},


	resetToDefaults_Storage: function()
	{
		//Reset data on the "Storage" tab to defaults

		//Show warning
		gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_reset_defaults"), 
			chrome.i18n.getMessage("msg_title_reset_defaults"), 
			chrome.i18n.getMessage("btn_reset"), 
			chrome.i18n.getMessage("btn_cancel"),
			function()
			{
				//User chose to reset the page

				//Get reference to default settings & actual settings
				var defSttgs = gl.getDefaultSettingsRef();

				//Apply new setting
				gl.onChangePersistentStorageType(defSttgs.nPersistStorageType, function(res)
				{
					//Set controls by updating the tab
					gl.updateTabCtrls_Storage();
				});
			});
	},


	resetToDefaults_Incognito: function()
	{
		//Reset data on the "Incognito" tab to defaults

		//Show warning
		gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_reset_defaults"), 
			chrome.i18n.getMessage("msg_title_reset_defaults"), 
			chrome.i18n.getMessage("btn_reset"), 
			chrome.i18n.getMessage("btn_cancel"),
			function()
			{
				//User chose to reset the page
				//console.log("[209] Resetting incog page");

				//Get reference to default settings & actual settings
				var defSttgs = gl.getDefaultSettingsRef();
				var stngs = gl.getSettingsRef();

				//Apply values
				stngs.bIncogCollectData = defSttgs.bIncogCollectData;
				stngs.bIncogSavePersistStorage = defSttgs.bIncogSavePersistStorage;
				stngs.nViewIncogData = defSttgs.nViewIncogData;

				//Set controls by updating the tab
				gl.updateTabCtrls_Incognito();

				//Then save it
				gl.saveSettings();
			});
	},

	resetToDefaults_Exceptions: function()
	{
		//Reset data on the "Exceptions" tab to defaults

		//Show warning
		gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_reset_defaults"), 
			chrome.i18n.getMessage("msg_title_reset_defaults"), 
			chrome.i18n.getMessage("btn_reset"), 
			chrome.i18n.getMessage("btn_cancel"),
			function()
			{
				//User chose to reset the page

				//Get reference to default settings & actual settings
				var defSttgs = gl.getDefaultSettingsRef();
				var stngs = gl.getSettingsRef();

				//Set exceptions array
				stngs.arrExcepts = defSttgs.arrExcepts;

				//Set controls by updating the tab
				gl.updateTabCtrls_Exceptions();

				//Then save it
				gl.saveSettings();
			});
	},


	resetToDefaults_Advanced: function()
	{
		//Reset data on the "Advanced" tab to defaults

		//Show warning
		gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_reset_defaults"), 
			chrome.i18n.getMessage("msg_title_reset_defaults"), 
			chrome.i18n.getMessage("btn_reset"), 
			chrome.i18n.getMessage("btn_cancel"),
			function()
			{
				//User chose to reset the page

				//Get reference to default settings & actual settings
				var defSttgs = gl.getDefaultSettingsRef();
				var stngs = gl.getSettingsRef();

				//Apply new setting
				stngs.nCollectFormDataFreqMs = defSttgs.nCollectFormDataFreqMs;
				stngs.nSavePersistDataFreqMs = defSttgs.nSavePersistDataFreqMs;
				stngs.bUseNativeScrollbars = defSttgs.bUseNativeScrollbars;

				//And do the flags
				// 0x10000 =	if ID and NAME of html element must be defined for it to be collected
				var flgs = stngs.nCollectFlgs & ~0x10000;
				flgs |= defSttgs.nCollectFlgs & 0x10000;
				stngs.nCollectFlgs = flgs;

				//And copy selection
				stngs.nCopySubstNewLines = defSttgs.nCopySubstNewLines;

				//At this point we need to update the main polling timers
				//INFO: Don't use a long delay in this case
				gl.resetMainDataCollectionTimer(1);
				gl.resetMainPersistDataSaveTimer(1);

				//Set controls by updating the tab
				gl.updateTabCtrls_Advanced();

				//Then save it
				gl.saveSettings();
			});
	},


	normalizeFormDataToStorage: function()
	{
		//Normalize data in the global 'gl.oTabsData' by making it fill contraints from settings
		//RETURN:
		//		= true if success
		//		= false if error
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.normalizeFormDataToStorage();
	},

	getUrlParams: function(url)
	{
		//Given a URL returns array with its "tail" parameters
		//Example: for "http://example.com:3000/pathname/?s=test&v=3" will return an object with props:
		//	{s: "test"},
		//	{v: "3"}
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getUrlParams(url);
	},

	onMessageProc: function(request, sender, sendResponse)
	{
		//Processes messages sent from the background.js
		if(request.action == "update03")
		{
			//Update options page
			gl.updateTabCtrls();
		}
		else
		{
			//Message is not processed here
			if(sendResponse)
				sendResponse(null);
		}
	},


	onInitPage: function()
	{
		//Init controls on the page (global for all tabs)
		//INFO: It is called only once after the Options page is shown

		//Set version
		$("#idVer").text(chrome.i18n.getMessage("version_num").replace("#V#", gl.getThisAppVersion()));

		//Set copyright
		var dtNow = new Date();
		var nYr = dtNow.getFullYear();
		var nYrMade = 2014;
		$("#idCprght").text(chrome.i18n.getMessage("copyright_msg").replace("#Y#", nYr > nYrMade ? nYrMade.toString() + " - " + nYr.toString() : nYrMade.toString()));

		//Set open source link for the GitHub project
		var objOpenSrc = $("#idOpenSrc");
		objOpenSrc.html(chrome.i18n.getMessage("openSource").replace("#U#", "https://github.com/dennisbabkin/Formalizr"));
		
		//Set dev name
		var objDev = $("#idDev");
		objDev.text("www.dennisbabkin.com");
		objDev.attr("href", "http://www.dennisbabkin.com/software");
		objDev.attr("target", "_blank");

		//Set check for updates link
		$("#idCheckUpdts").click(function(e)
		{
			//Prevent default actions on the link
			e.stopPropagation();
			e.preventDefault();

			gl.onCheckForUpdates(e.target);
		});


		//Set click event on all checkboxes
		$(":checkbox").change(function(e)
		{
			//A checkbox was changed
			gl.onCheckboxChange(this);
		});

		//Set click event on all radio boxes
		$(":radio").change(function(e)
		{
			//A radio box was changed
			gl.onRadioboxChange(this);
		});

		//Set click event for all special links
		$(".lnkInline").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});

		$(".lnkBlock").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});

		//Set link for "Apply changes" on the Memory page
		$("#idLnkApplyChngs").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});


		//Controls specific for General page

		//Enable "Reset to default" link
		$("#idRstDefs_General").click(function(e)
		{
			//Prevent default actions on the link
			e.stopPropagation();
			e.preventDefault();

			gl.resetToDefaults_General();
		});



		//Controls specific for Storage page

		//Enable "Reset to default" link
		$("#idRstDefs_Storage").click(function(e)
		{
			//Prevent default actions on the link
			e.stopPropagation();
			e.preventDefault();

			gl.resetToDefaults_Storage();
		});



		//Controls specific for Memory page

		//Set storage sliders
        var objSliderMaxNumPgs = document.getElementById("idRangeMaxNumPgs");
        var objSliderMaxNumTbxPerPg = document.getElementById("idRangeMaxNumTbxPerPg");
        var objSliderMaxNumEntrysPerTbx = document.getElementById("idRangeMaxNumEntrysPerTbx");

		//Get min/max settings values
		var objMinMax = gl.getMinMaxSettingsVals();

		//Set min/max ranges
		objSliderMaxNumPgs.min = objMinMax.nMaxPageNum.min;
		objSliderMaxNumPgs.max = objMinMax.nMaxPageNum.max;
		objSliderMaxNumTbxPerPg.min = objMinMax.nMaxTxBxNum.min;
		objSliderMaxNumTbxPerPg.max = objMinMax.nMaxTxBxNum.max;
		objSliderMaxNumEntrysPerTbx.min = objMinMax.nMaxTxtValNum.min;
		objSliderMaxNumEntrysPerTbx.max = objMinMax.nMaxTxtValNum.max;

		//Set slider events
		objSliderMaxNumPgs.addEventListener("change", function(e){ 
			gl.onSliderPosChanged_MaxNumPgs(e.target);
		});

		objSliderMaxNumTbxPerPg.addEventListener("change", function(e){ 
			gl.onSliderPosChanged_MaxNumTbxPerPg(e.target);
		});

		objSliderMaxNumEntrysPerTbx.addEventListener("change", function(e){ 
			gl.onSliderPosChanged_MaxNumEntrysPerTbx(e.target);
		});

		//Set button events
		document.getElementById("idBtnLessMaxNumPgs").addEventListener("click", function(e){ gl.onButtonLess_MaxNumPgs(e.target); });
		document.getElementById("idBtnMoreMaxNumPgs").addEventListener("click", function(e){ gl.onButtonMore_MaxNumPgs(e.target); });

		document.getElementById("idBtnLessMaxNumTbxPerPg").addEventListener("click", function(e){ gl.onButtonLess_MaxNumTbxPerPg(e.target); });
		document.getElementById("idBtnMoreMaxNumTbxPerPg").addEventListener("click", function(e){ gl.onButtonMore_MaxNumTbxPerPg(e.target); });

		document.getElementById("idBtnLessMaxNumEntrysPerTbx").addEventListener("click", function(e){ gl.onButtonLess_MaxNumEntrysPerTbx(e.target); });
		document.getElementById("idBtnMoreMaxNumEntrysPerTbx").addEventListener("click", function(e){ gl.onButtonMore_MaxNumEntrysPerTbx(e.target); });


		//Set event for monitoring Shift-click on the Memory tab itself
		$("#tabs ul>li a").eq(gl.getTabIndexByDomID("#tabMemory")).click(function(e)
		{
			//Only if we've got shift too
			if(e.shiftKey)
			{
				//Show advanced memory management section
				$("#idFsAdvMemOps").show();

				//console.log("Shift-click");
			}
		});

		//Enable "Reset to default" link
		$("#idRstDefs_Memory").click(function(e)
		{
			//Prevent default actions on the link
			e.stopPropagation();
			e.preventDefault();

			gl.resetToDefaults_Memory();
		});




		//Controls specific for Incognito page
		$("#idViewMxd").change(function(e)
		{
			//Selection changes

			//Get selected value in the mixed view drown-down box
			var nVal = $(this).val();

			//Convert it to interget
			nVal = parseInt(nVal, 10);

			//And update mixed data sel descr
			if(gl.updateAfterViewMxdChange(nVal))
			{
				//And save the value in settings
				gl.getSettingsRef().nViewIncogData = nVal;
				gl.saveSettings();
			}
			else
			{
				//Failed
				gl.saveFailed();
			}

		});


		//Controls specific for Exceptiosn page

		//Enable "Reset to default" link
		$("#idRstDefs_Xcpts").click(function(e)
		{
			//Prevent default actions on the link
			e.stopPropagation();
			e.preventDefault();

			gl.resetToDefaults_Exceptions();
		});


		//Controls specific for Advanced page
		$("#idCopyTxtOpt").change(function(e)
		{
			//Selection changes

			//Get selected value in the mixed view drown-down box
			var nVal = $(this).val();

			//Convert it to interget
			nVal = parseInt(nVal, 10);

			//See if the values are acceptable
			var objMinMax = gl.getMinMaxSettingsVals();

			if(nVal >= objMinMax.nCopySubstNewLines.min && 
				nVal <= objMinMax.nCopySubstNewLines.max)
			{
				//And save the value in settings
				gl.getSettingsRef().nCopySubstNewLines = nVal;
				gl.saveSettings();
			}
			else
			{
				//Failed
				gl.saveFailed();
			}
		});


		//Set storage sliders
        var objSliderDataColFreq = document.getElementById("idRangeDataColFreq");
        var objSliderPersistSaveFreq = document.getElementById("idRangePersistSaveFreq");

		//Set min/max ranges
		objSliderDataColFreq.step = gl.gnAdvSldrFreqGrad_DataColFreq;
		objSliderDataColFreq.min = objMinMax.nCollectFormDataFreqMs.min;
		objSliderDataColFreq.max = objMinMax.nCollectFormDataFreqMs.max;

		objSliderPersistSaveFreq.step = gl.gnAdvSldrFreqGrad_PersistSaveFreq;
		objSliderPersistSaveFreq.min = objMinMax.nSavePersistDataFreqMs.min;
		objSliderPersistSaveFreq.max = objMinMax.nSavePersistDataFreqMs.max;

		//Set slider events
		objSliderDataColFreq.addEventListener("change", function(e){ 
			gl.onSliderPosChanged_DataColFreq(e.target);
		});

		objSliderPersistSaveFreq.addEventListener("change", function(e){ 
			gl.onSliderPosChanged_PersistSaveFreq(e.target);
		});

		//Set button events
		document.getElementById("idBtnLessDataColFreq").addEventListener("click", function(e){ gl.onButtonLess_DataColFreq(e.target); });
		document.getElementById("idBtnMoreDataColFreq").addEventListener("click", function(e){ gl.onButtonMore_DataColFreq(e.target); });

		document.getElementById("idBtnLessPersistSaveFreq").addEventListener("click", function(e){ gl.onButtonLess_PersistSaveFreq(e.target); });
		document.getElementById("idBtnMorePersistSaveFreq").addEventListener("click", function(e){ gl.onButtonMore_PersistSaveFreq(e.target); });


		//Enable "Reset to default" link
		$("#idRstDefs_Adv").click(function(e)
		{
			//Prevent default actions on the link
			e.stopPropagation();
			e.preventDefault();

			gl.resetToDefaults_Advanced();
		});


	}


};



//!!!First thing!!!! -- make sure to override the console calls
gl.overrideConsole();


//Hide tabs to prevent visual artifact
//$("#tabs").hide();
$("body").hide();

//Localize html content first
gl.localizeHtmlPage();

//Make elements on page non-draggable
gl.makeNonDraggable();

//Load singletons
gl.gSngltnPrmpts.loadSingletons();


//Wait for the page to load
$(function() 
{
	//Get the tab that we're running from
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
	{
		//Got it
		gl.gnThisTabID = tabs[0].id;

		//Parse this URL
		var objUrlPrms = gl.getUrlParams(document.URL);

		//Pick the tab to activate, [0 and up)
		var nActvTabInd = 0;

		//Do we have a request for the tab?
		if(objUrlPrms.p)
		{
			//Look up its index
			//		= Tab index by a DOM ID, example: "#tabGeneral"
			//		= -1 if not found
			var iInd = gl.getTabIndexByDomID('#' + objUrlPrms.p);
			if(iInd != -1)
			{
				//Activate this tab
				nActvTabInd = iInd;
			}
		}
	
		//Initiate "tabs" control
		var objTabs = $("#tabs");
		objTabs.tabs({
			active: nActvTabInd,
			activate: function(event ,ui)
			{
				//Tab was activated
				gl.onTabSelected(ui.newTab.index(), event.shiftKey ? true : false);
			}
		});

		//Init page (must be called after tabs are created)
		gl.onInitPage();

		//Show document (we need to first hide it to prevent flicker when tabs is composed)
		//objTabs.show();
		$("body").show();
	
		//Send notification of the active tab
		gl.onTabSelected(nActvTabInd, false);


		//Set event listeners
		chrome.tabs.onActivated.addListener(function(activeInfo) 
		{
			//Make sure that it's our tab
			if(activeInfo.tabId == gl.gnThisTabID)
			{
				//Called when Options tab is activated
				//console.log("actv");

				//Update panels
				gl.updateTabCtrls();
			}
		});

		//Event when this window gains focus
		chrome.windows.onFocusChanged.addListener(function(windowId)
		{
			//Preserve winid
			(function()
			{
				//Get current window
				chrome.windows.getCurrent({populate: false}, function(wnd)
				{
					//Is it our window?
					if(windowId == wnd.id)
					{
						//Our window just gained focus, update panels
						gl.updateTabCtrls();
					}
				});
			}());
		});

		//Event dispatched from outside
		chrome.runtime.onMessage.addListener(gl.onMessageProc);


	});
});
