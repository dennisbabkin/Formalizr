// Info JavaScript Document

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

	gnThisTabID: null,					//ID of the Chrome tab the Info page is displayed in
	gstrSelTabId: null,					//ID of the Info page tab (control on the page) that is currently selected, example: "#tabGeneral"



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
					gl.logExceptionReport(310, e);
				}
            };

            document.execCommand("Copy", false, null);
            document.oncopy = undefined;

            return res;
        }
        catch(e)
        {
            //Exception
            gl.logExceptionReport(290, e);

            return false;
        }
    },

	replaceNewLines: function(str)
	{
		//Substitute new-lines in 'str' with OS specific ones, according to user selection
        var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.replaceNewLines(str);
	},

	getSettingsRef: function()
	{
		//RETURN: Reference to settings object, see 'gl.gSettings' in background.js
		//		  INFO: You can modify the original settings by modifying the returned object!
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.gSettings;
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


	onCheckForUpdates: function(elmt)
	{
		//Called when the link to "Check for updates" was clicked
		//'elmt' = DOM element for <a> that was clicked

		//See if we already clicked it?
		if(!elmt.bUpdateAvail)
		{
			console.log("[250] Checking for updates");

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
						console.log("[252] Update check result: " + status + ", v=" + details.version);

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
			console.log("[251] Manually reloading to install update");

			//Let background.js do the work
			var bgPage = chrome.extension.getBackgroundPage();
			bgPage.gl.onInstallUpdate();
		}
	},

	getLastVisitedURL: function()
	{
		//RETURN:
		//		= Last visited URL, or
		//		= "" if none or not known
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getLastVisitedURL();
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

	openURL: function(url)
	{
		//Open URL in a new tab
		//INFO: Opens it whether a tab with such URL already existed or not!
		//'url' = URL to open
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.openURL(url);
	},

	openPageIfNotOpened: function(openUrl, tailUrl)
	{
		//Open 'openUrl' in a new tab, if it doesn't already exist (otherwise it switches to that tab or window)
		//'tailUrl' = if specified, must contain the tail section of the URL. Example: "?v=something&w=1"
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.openPageIfNotOpened(openUrl, tailUrl);
	},

	openFAQPageIfNotOpened: function(nQNumber)
	{
		//Open our online FAQ page if it's not already opened
		//'nQNumber' = if specified, must be set to question number to display (example: "2" for question #2)
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.openFAQPageIfNotOpened(nQNumber);
	},

	openContactPageIfNotOpened: function(bBugReport, strInfo)
	{
		//Open software feedback or bug report page, if it doesn't already exist (otherwise it switches to that tab or window)
		//'bBugReport' = true for bug report page, otherwise software feedback
		//'strInfo' = if specified, information to pass into report (keep it short though!)
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.openContactPageIfNotOpened(bBugReport, strInfo);
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

	getSupportedLangIDs: function(callbackDone, bNormalize, bSort)
	{
		//Retrieves the list of supported language IDs (example: "en-US", "en", "de", etc.)
		//INFO: Full list of available lang ID can be found at:
		//			https://developer.chrome.com/webstore/i18n?csw=1#localeTable
		//'callbackDone' = if specified, will be called with the result as such: callbackDone(res, arrLangIDs), where:
		//					'res' =			could be:
		//										= true if success, check 'arrLangIDs'
		//										= Error description if error
		//					'arrLangIDs' =	array with language IDs, (example: "en-US", "en", "de", etc.), or [] if error
		//'bNormalize' = true to make all language IDs as lower case strings, with dashes "-" replaced with underscores "_"
		//'bSort' = true to sort results returned in 'callbackDone'
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getSupportedLangIDs(callbackDone, bNormalize, bSort);
	},

	getAcceptedLangIDs: function(callbackDone)
	{
		//Get list of language ID codes supported by the web browser
		//'callbackDone' = method that is called with the result as such: callbackDone(arrLangIDs), where 'callbackDone' is:
		//					= [string] Language ID code, always lower case with dashes "-" replaced with underscores "_" (example: "en_us", "de", etc.)
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getAcceptedLangIDs(callbackDone);
	},

	getLangEngNameByLangID: function(langID)
	{
		//Get language English name by 'langID'
		//'langID' = language ID - case-insensitive. Example: "en", "en_GB", etc.
		//				INFO: Can be one of the "Locale code" values from here: https://developer.chrome.com/webstore/i18n?csw=1#localeTable
		//RETURN:
		//		= Language name (in English), or
		//		= "" if not found
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getLangEngNameByLangID(langID);
	},

	getFullUILangList: function()
	{
		//RETURN: Object with all supported languages by Chrome
		//			Source: https://developer.chrome.com/webstore/i18n?csw=1#localeTable
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getFullUILangList();
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
			case '#tabAbout':
			{
				gl.onTabSelected_About();
			}
			break;

			case '#tabManual':
			{
				gl.onTabSelected_Manual();
			}
			break;

			case '#tabTranslate':
			{
				gl.onTabSelected_Translate();
			}
			break;

			case '#tabFeedback':
			{
				gl.onTabSelected_Feedback();
			}
			break;

			default:
			{
				console.error("[253] No handler for tab `" + strTabID + "`, index=" + nTabIndex);
			}
			break;
		}
		
		//Set tab selected
		gl.gstrSelTabId = strTabID;

	},
	
	onTabSelected_About: function()
	{
		//Called when tab was selected

		//Update controls in the tab
		gl.updateTabCtrls_About();

	},
	
	onTabSelected_Manual: function()
	{
		//Called when tab was selected

		//Update controls in the tab
		gl.updateTabCtrls_Manual();

	},
	
	onTabSelected_Translate: function()
	{
		//Called when tab was selected

		//Update controls in the tab
		gl.updateTabCtrls_Translate();

	},
	
	onTabSelected_Feedback: function()
	{
		//Called when tab was selected

		//Update controls in the tab
		gl.updateTabCtrls_Feedback();

	},


	updateTabCtrls: function()
	{
		//Update controls for the currently selected tab
		switch(gl.gstrSelTabId)
		{
			case '#tabAbout':
			{
				gl.updateTabCtrls_About();
			}
			break;

			case '#tabManual':
			{
				gl.updateTabCtrls_Manual();
			}
			break;

			case '#tabTranslate':
			{
				gl.updateTabCtrls_Translate();
			}
			break;

			case '#tabFeedback':
			{
				gl.updateTabCtrls_Feedback();
			}
			break;

			default:
			{
				console.error("[254] No handler for tab '" + gl.gstrSelTabId + "'");
			}
			break;
		}
	},


	updateTabCtrls_About: function()
	{
		//Update controls in the tab

	},
	
	updateTabCtrls_Manual: function()
	{
		//Update controls in the tab

		//Only do it once
		if(!gl._gbUpdtdManualTab)
		{
			//Set flag
			gl._gbUpdtdManualTab = true;

			//Go through images and set their URLs
			//$("#idManTxt01").find("p>img").each(function(i)
			$('img', $('#idManTxt01')).each(function(i)
			{
				var objImg = $(this);

				//Make them non-draggable --  draggable="false"
				objImg.attr('draggable', false);

				//Img ID
				var imgID = objImg.attr('id');

				//Only if it has no source
				if(imgID && !objImg.attr('src'))
				{
					//Set the image source
					objImg.attr('src', "images/" + imgID + ".png");
				}
			});
		}

	},
	_gbUpdtdManualTab: null,		//[Used internally]


	updateTabCtrls_Translate: function()
	{
		//Update controls in the tab

		//Do this only once
		if(!gl._gbUpdtdTranslateTab)
		{
			var objExsting = $("#idLangsExsting");
			var objAvail = $("#idLangsAvail");

			//Empty both combos
			objExsting.empty();
			objAvail.empty();

//var bgPage = chrome.extension.getBackgroundPage();
//var ooo = bgPage.gl.getLangUIAsJSON("en", function(res, objJsn)
//{
//	var rr = res;
//});


			//Get list of language IDs
			gl.getSupportedLangIDs(function(res, arrLangIDs)
			{
				//Receives the result
				//					'res' =			could be:
				//										= true if success, check 'arrLangIDs'
				//										= Error description if error
				//					'arrLangIDs' =	array with language IDs, (example: "en-US", "en", "de", etc.), or [] if error
				if(res === true)
				{
					//Get current UI languages
					gl.getAcceptedLangIDs(function(arrAccLangs)
					{
						//Set flag not to do this again
						gl._gbUpdtdTranslateTab = true;

						var lngID = null;
						var lngDefID = null;

						//Make the "already done" combo
						for(var i = 0; i < arrLangIDs.length; i++)
						{
							lngID = arrLangIDs[i];
							if(lngID)
							{
								//See if it's a default language
								var strSelected = "";
								if(!lngDefID)
								{
									//Is it in our list
									for(var s = 0; s < arrAccLangs.length; s++)
									{
										if(arrAccLangs[s] == lngID)
										{
											strSelected = " selected";
											break;
										}
									}
								}

								var langName = gl.getLangEngNameByLangID(lngID);

								objExsting.append('<option value="' + gl.encodeHtml(lngID) + '"' + strSelected + '>' + 
									gl.encodeHtml(langName ? langName : "[" + lngID + "]") + '</option>');
							}
						}


						//Get all available langs
						var arrAllLangs = gl.getFullUILangList();

						var arrAvailLangs = [];

						//Then make available languages
						for(var langID in arrAllLangs)
						{
							//It must not be already used
							var bFoundIt = false;
							for(var u = 0; u < arrLangIDs.length; u++)
							{
								var strLg = arrLangIDs[u];
								if(strLg)
								{
									strLg = strLg.toLowerCase();
									if(strLg == langID)
									{
										bFoundIt = true;
										break;
									}
								}
							}

							if(!bFoundIt)
							{
								//Add it
								arrAvailLangs.push({
									id: langID,
									nm: gl.getLangEngNameByLangID(langID)
								});
							}
						}

						//Sort them by name
						arrAvailLangs.sort(function(a, b){
							//1:    if 'a' is greater than 'b'
							//-1:   if 'a' is less than 'b'
							//0:    if 'a' is equal to 'b'
							if(a.nm > b.nm)
								return 1;
							else if(a.nm < b.nm)
								return -1;
							else
								return 0;
						});


						//Add to the drop-down
						for(var i = 0; i < arrAvailLangs.length; i++)
						{
							var langID = arrAvailLangs[i].id;
							var langName = arrAvailLangs[i].nm;

							objAvail.append('<option value="' + gl.encodeHtml(langID) + '">' + 
								gl.encodeHtml(langName ? langName : "[" + langID + "]") + '</option>');
						}

					});
				}
				else
				{
					//Error
					gl.logError("[297] ERR: " + res);
				}
			}, 
			true,		//Normalize
			true);		//Sort

		}

	},
	_gbUpdtdTranslateTab: null,		//[Used internally]


	onLinkTranslateContactUs: function()
	{
		//Called when "Contact us" link on the translate page is clicked
		
		//Get selected language
		var langID = $("#idLangsAvail").val();
		//console.log("log=" + langID);

		//Go to the feedback page
		gl.openContactPageIfNotOpened(false, 
			"REQUEST: UI Translation\n" +
			"REQUEST LANGID: [" + langID + "] " + gl.getLangEngNameByLangID(langID));
	},
	
	onLinkBugReportContactUs: function(bIncludeFullReport)
	{
		//Called when "Contact us" link on the Bug Report page is clicked
		//'bIncludeFullReport' = true to include the full bug report
		
		//Get selected language
		var reportURL = $("#idReportBugURL").val();
		reportURL = reportURL ? reportURL.toString().trim() : "";

		//Prep report
		var strFmt = "REQUEST: Bug report\n" +
				"REPORT URL: \"" + reportURL + "\"";

		if(bIncludeFullReport !== true)
		{
			//Go to the feedback page (do not include full report)
			gl.openContactPageIfNotOpened(true, strFmt);
		}
		else
		{
			//Collect report first

			//Format settings as JSON (for human readble format)
			//				1 = include extra global values (remove user-sensitive info)
			//				2 = include extra global values (nothing is removed)
			//				0 = do not include anything extra
			gl.getSettingsExport("sttgsObjReport", 2, true, function(strRep)
			{
				//	'strRep' =		[string] Special JSON for exported settings + other requested stuff
				//					null if error
				var res = false;

				if(strRep !== null)
				{
					//Adjust report
					strFmt = strRep + "\n\n=================================\n" + strFmt;
				}
				else
				{
					//Error
					console.error("[314] ERR: Failed to collect full report");
				}

				//Go to the feedback page
				gl.openContactPageIfNotOpened(true, strFmt);
			});
		}
	},


	_collectBugReport: function(nExtras, callbackDone)
	{
		//Collect bug report
		//'nExtras' = include extra values, can be one of:
		//				1 = include extra global values (remove user-sensitive info)
		//				2 = include extra global values (nothing is removed)
		//				0 = do not include anything extra
		//'callbackDone' = called with result as such: callbackDone(res), where:
		//					'res = true if success, false if error

		try
		{
			//Format settings as JSON (for human readble format)
			gl.getSettingsExport("sttgsObjReport", nExtras, true, function(strRep)
			{
				//	'strRep' =		[string] Special JSON for exported settings + other requested stuff
				//					null if error
				var res = false;

				if(strRep !== null)
				{
					//Copy it to clipboard
					if(gl.clipboardCopyText(strRep, true))
					{
						//Success
						res = true;
					}
				}

				//Result
				if(callbackDone)
					callbackDone(res);
			});
		}
		catch(e)
		{
            //Exception
            gl.logExceptionReport(305, e);

			if(callbackDone)
				callbackDone(false);
		}
	},

	onLinkCollectBugReport: function(bShiftKey)
	{
		//Collect data for bug report & copy it to clipboard
		//'bShiftKey' = true if Shift key was pressed

		//				1 = include extra global values (remove user-sensitive info)
		//				2 = include extra global values (nothing is removed)
		//				0 = do not include anything extra
		gl._collectBugReport(bShiftKey ? 2 : 1, function(res)
		{
			//					'res = true if success, false if error
			var styleClass = "";
			var resMsg = "";

			//Error?
			if(res)
			{
				//Done
				styleClass = "copyReportOK";
				resMsg = chrome.i18n.getMessage("msg_copied_ok");
			}
			else
			{
				//Error
				styleClass = "copyReportErr";
				resMsg = chrome.i18n.getMessage("msg_collect_err");
			}

			//Show message
			var objSpan = $("#idReportConf");
			objSpan.attr('class', styleClass);
			objSpan.text(resMsg);

			//Set timer to remove it
			window.setTimeout(function()
			{
				//Remove it
				$("#idReportConf").text("");
			},
			5000);
		});
	},
	

	updateTabCtrls_Feedback: function()
	{
		//Update controls in the tab

	},
	

	onShowLegalWindow: function()
	{
		//Open a window and show legal info

		var txtLegal = chrome.i18n.getMessage("txtLegal");

		//Set popup html body
		$('#dialog-legal-msgbdy').html('<div id="divTaLegal"><textarea id="idTaLegal" readonly>' + gl.encodeHtml(txtLegal) + '</textarea></div>'
			);

		//Display a model window
		$( "#dialog-legal" ).dialog({
			resizable: true,
			height: 'auto',
			width: 640,
			height: 500,
			minWidth: 562,
			minHeight: 300,
			modal: true,
			title: chrome.i18n.getMessage("msg_lgndLegal"),
			buttons: [
			{
				text: chrome.i18n.getMessage("lnk_copy"),
				click: function()
				{
					//Copy clicked
					if(gl.clipboardCopyText(txtLegal, true))
					{
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

		//Shift key
		var bShift = !!evt.shiftKey;

		switch(id)
		{
			case 'idLnkOpenLegal':
			{
				//Show legal info in a window
				gl.onShowLegalWindow();
			}
			break;

			case 'idLnkCopyLegal':
			{
				//Copy legal jargon
				var lglTxt = chrome.i18n.getMessage("txtLegal");
				if(lglTxt)
				{
					//Copy it to clipboard
					if(gl.clipboardCopyText(lglTxt, true))
					{
						//Show confirmation
						link.innerText = gl.encodeHtml(chrome.i18n.getMessage("lnk_done"));

						setTimeout(function(){
							link.innerText = gl.encodeHtml(chrome.i18n.getMessage("lnk_copy"));
						}, 900);
					}
				}
			}
			break;

			case 'lnkFullScreen':
			{
				//Play YoutTube clip full screen
				var playerElement = document.getElementById("idVid01");

				//Set it to auto-play
				var src = playerElement.src;
				playerElement.src = src + (src.indexOf('?') == -1 ? "?" : "&") + "autoplay=1";

				//And make it go full-screen
				playerElement.req = playerElement.requestFullscreen
					|| playerElement.webkitRequestFullscreen
					|| playerElement.mozRequestFullScreen
					|| playerElement.msRequestFullscreen;

				if(playerElement.req)
					playerElement.req();
			}
			break;

			case 'lnkContactTranslate':
			{
				//Conact us link from the Translate tab
				gl.onLinkTranslateContactUs();
			}
			break;

			case 'lnkFAQPage':
			case 'lnkFAQPage2':
			{
				//FAQ page link
				gl.openFAQPageIfNotOpened();
			}
			break;

			case 'lnkContactGeneral':
			{
				//Contact us link - general

				//Go to the feedback page
				gl.openContactPageIfNotOpened(false);
			}
			break;

			case 'lnkCollectReport':
			{
				//Collect report link
				gl.onLinkCollectBugReport(bShift);

			}
			break;

			case 'lnkContactBugs':
			{
				//Send bug link
				gl.onLinkBugReportContactUs(bShift);
			}
			break;

			case 'idVisitReportBugURL':
			{
				//Visit provided bug URL

				//Open URL
				gl.openURL($("#idReportBugURL").val());
			}
			break;

			case 'lnkDonate':
			{
				//Donation link
				gl.openURL("http://www.dennisbabkin.com/php/donate.php?id=formalizr");
			}
			break;

			default:
			{
				console.error("[289] Unprocessed link clicked, id=" + id);
			}
			break;
		}
	},


	//onInitYouTubePlayer: function()
	//{
	//	//Create YouTube player

	//	//For info check:
	//	//		https://developers.google.com/youtube/iframe_api_reference?csw=1

	//	//The following will load the YouTube API synchronously
	//	var tag = document.createElement('script');
	//	tag.src = "https://www.youtube.com/iframe_api";
	//	var firstScriptTag = document.getElementsByTagName('script')[0];
	//	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	//	// 3. This function creates an <iframe> (and YouTube player)
	//	//    after the API code downloads.
	//	var player;
	//	window.onYouTubeIframeAPIReady = function()
	//	{
	//		//Called when player is loaded
	//		player = new YT.Player('player', {
	//			height: '390',
	//			width: '640',
	//			videoId: 'qM35ZldWWl8',
	//			events: 
	//			{
	//				'onReady': function(evt)
	//				{
	//					//Called when player is loaded
	//					evt.target.playVideo();
	//				}
	//			}
	//		});
	//	}

	//},


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
		objDev.attr("href", "https://www.dennisbabkin.com/software");
		objDev.attr("target", "_blank");

		//Set check for updates link
		$("#idCheckUpdts").click(function(e)
		{
			//Prevent default actions on the link
			e.stopPropagation();
			e.preventDefault();

			gl.onCheckForUpdates(e.target);
		});


		//Set click event for all special links
		$(".lnkInline").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});

		//Contact us link for translation
		$("#lnkContactTranslate").attr('href', '#');
		$("#lnkContactTranslate").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});



		//Controls specific for About window

		//Enable "manual" link
		$("#idAboutDesc").find("a").each(function(i)
		{
			//Set the link
			var objA = $(this);
			var idA = objA.attr('href');

			if(idA == 'tabManual')
			{
				//Set link
				objA.attr('href', "#");
				objA.click(function(evt)
				{
					//First prevent its propagation
					evt.stopPropagation();
					evt.preventDefault();

					//Open the tab
					$("#tabs").tabs({ active: gl.getTabIndexByDomID("#" + idA) });
				});
			}
		});

		////Create YouTube player
		//gl.onInitYouTubePlayer();

		//Init YouTube player not to show related videos at the end
		//For info check:
		//		https://developers.google.com/youtube/player_parameters
		var ytPlyr = $("#idVid01");
		var src = ytPlyr.attr('src');
		ytPlyr.attr('src', src + (src.indexOf('?') == -1 ? "?" : "&") + "rel=0");


		//Controls specific for Feedback window

		//FAQ page (links)
		$("#lnkFAQPage").attr('href', '#');
		$("#lnkFAQPage").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});

		$("#lnkFAQPage2").attr('href', '#');
		$("#lnkFAQPage2").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});


		//Contact us link (general)
		$("#lnkContactGeneral").attr('href', '#');
		$("#lnkContactGeneral").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});

		//Collect Report link 
		$("#lnkCollectReport").attr('href', '#');
		$("#lnkCollectReport").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});

		//Send bug link 
		$("#lnkContactBugs").attr('href', '#');
		$("#lnkContactBugs").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});

		//Visit URL page
		$("#idVisitReportBugURL").attr('title', chrome.i18n.getMessage("prompt_OpenPage"));
		$("#idVisitReportBugURL").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});

		//Set last visited page
		$("#idReportBugURL").val(gl.getLastVisitedURL());

		//Donation link
		$("#lnkDonate").attr('href', '#');
		$("#lnkDonate").click(function(e)
		{
			gl.onLinkClicked(this, e);
		});


	}


};


//!!!First thing!!!! -- make sure to override the console calls
gl.overrideConsole();


//Hide tabs to prevent visual artifact
$("body").hide();

//Localize html content first
gl.localizeHtmlPage();

gl.makeNonDraggable();


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


	});
});
