// Background JavaScript functions -- contains main logic for the app

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
	//Global object that holds associations between tabIDs and page URLs in 'oStorage'
    oTabsData: {},		                    //Uses TabID as keys to properties
											//	 Keys =	Tab ID from chrome
											//	 Values = The following properties for the page:
											//			   'pageData'		[Object] data for the page, see content.js and collectAllFormData() for details. Can be 'null' if none collected yet
											//			   'pageURL'		[string] page URL
											//			   'injCntr'		[integer] 0 and up - counter of successive injections of content script into this tab
											//			   'bdg'			[Object] icon badge info for the tab with properties:
											//									'bDataCollected' =		'true' if current tab form data was collected (note that it doesn't mean that data collection was turned on)
											//									'bIncogTab' =			'true' if this tab was running in "Incognito" mode
											//									'bExceptOn' =			'true' if this tab did not pass URL exception check (data is not collected for it)
											//									'nTxbBxCnt' =			[integer] [0 and up) for number of textboxes found for the tab in 'oTabData', or -1 if error
											//									'nIconType' =			[integer] Badge icon type to use for the tab. One of:
											//																		0 =		gray
											//																		1 =		blue (working)
											//																		2 =		purple (incognito)
											//																		8 =		gray - disabled
											//																		9 =		blue - disabled
											//																		10 =	purple (incognito) - disabled
											//																		16 =	gray - exception on
											//																		17 =	blue - exception on
											//																		18 =	purple (incognito) - exception on
											//									'strIconText' =			[string] Currently used badge text for the tab (used to prevent repeated badge updates)
											//									'strIconTextClr' =		[string] Currently used badge text color (as "#ff0000") for the app icon (used to prevent repeated badge updates)
											//									'strPromptText' =		[string] Currently used badge tooltip prompt text for the tab (used to prevent repeated badge updates)

	//Global object that holds info about the app's default badge
	oBadge: {
		bEnabledCollect: null					//'true' if collection of form data was enabled (in either case: regular or incognito), 'false' if it was turned off, or 'null' if unknown
	},

	oStorage: {},
	//'oStorage' is an object that holds saved textbox data per each web page. (The maximum number of pages is defined by the 'nMaxPageNum' variable.)
	//			  Keys =	Page full URL where this data was saved from.
	//			  Values =	The following properties for the page:
	//				'tm'	[Integer] UTC time when page was last saved, expressed as an integer of milliseconds since midnight of January 1, 1970
	//				'flg'	[Integer] Bitwise set of flags:
	//									0x1 =	set if had to stop collecting textboxes at maximum number of 'nMaxTxBxNum'
	//									0x2 =	set if page data came from "Incognito" tab
	//				'ttl'	[String] Page title, can be ""
	//				'fav'	[String] Favorites icon for the page (absolute) URL, can be ""
	//				'frms'	Object with data for all iframes in this page. Its properties:
	//						 Keys = 	Frame URLs (or "." for the main page) -- for IFRAMEs it may be: "n>URL", where n is IFRAME index
	//						 Values = 	Object for each textbox data with the following properties:
	//                                   Keys =     Textbox special ID (used in this struct, as html ID, followed by html name)
	//                                   Values =   Object for the textbox with the following properties:
	//						                         'si'		 [integer] Sequential integer/index for this textbox -- trying to make it unique for all ctrls on this page
	//												 'osi'		 [integer] Original sequential integer/index for this textbox, assigned by the element's order in content script
	//						                         'id'		 [string] html ID of the element (can be 'null' or "" if no such)
	//	                        					 'nm'		 [string] html Name of the element (can be 'null' or "" if no such)
	//				                        		 'tp'		 [string] html type of the element, always lower-case (cannot be 'null' or "") -- example: "textbox", "search", "textarea", etc.
	//					                        	 'tx'		 [Array] Object with textbox text and when it was saved (max size is defined by 'nMaxTxtValNum' variable):
	//					                						  'tm'	[Integer] number of milliseconds between UTC time of saving 'v' and midnight of January 1, 1970
	//						                					  'v'	[string] text in the textbox (cannot be "" or 'null)

	gbMod_oStorage: false,			//'true' if data in 'oStorage' has been changed since last time (when this variable was reset to 'false')

	//Global settings (cached from the persistent storage)
	//INFO: These values below will be used by default.
	gSettings: {
		appVersion: "",				//[String] This app's version number that these settings were saved from (will be set later) -- used for authentication & checks of settings when loading from persistent storage

		bCollectData: true,			//true to allow data collection from visted web pages (overrides 'bIncogCollectData')
		bIncogCollectData: true,		//true to allow data collection from visted web pages opened in the "Incognito" tabs (can be overridden by 'bCollectData')

		nCollectFlgs: 0x200FF,		//Bitwise integer specifying which textboxes to collect & how:
									// 0x1 =		collect textarea
									// 0x2 =		collect "contentEditable" html elements (and treat them as textarea in our "popup" window)
									// 0x4 =		collect input: text
									// 0x8 =		collect input: email
									// 0x10 =		collect input: number
									// 0x20 =		collect input: search
									// 0x40 =		collect input: tel
									// 0x80 =		collect input: url
									// 0x10000 =	if ID and NAME of html element must be defined for it to be collected
									// 0x20000 =	collect data from elements that are marked for "autocomplete off"

		arrExcepts: [],				//Array with exceptions (if web page URL matches any of these, its data is not collected)
									//INFO: Max number of elements = 'gnMaxExcepts'
									//      The newer elements are added to the bottom of the array.
									//Each item is an object with the following props:
									//	'mt'		= [string] match string, cannot be empty (always in lower case!)
									//	'rx'		= 'true' if 'mt' contains Regular Expressions, otherwise - if it's just a match string
									//	'tp'		= type of the match, one of:
									//				   INFO: We'll assume page URL is: http://www.slides.example.com:80/php/page.php?what=doc#print
									//					0	= full case-insensitive match of the entire URL
									//					1	= case-insensitive match of host name only (excluding www & port number), or: "slides.example.com"
									//					2	= case-insensitive match of host name only (excluding port number), or: "www.slides.example.com"
									//					3	= case-insensitive match of host name (excluding www & port number) + page only, or: "slides.example.com/php/page.php"
									//					4	= case-insensitive match of host name (excluding port number) + page only, or: "www.slides.example.com/php/page.php"

		nMaxPageNum: 48,			//[1 - 512] Maximum number of pages to save before recycling old ones								["Maximum number of pages"]
		nMaxTxBxNum: 32,			//[1 - 128] Maximum number of textboxes per page (including all iframes in the page)				["Maximum number of text boxes per page"]
		nMaxTxtValNum: 32,			//[1 - 256] Maximum number of text values per textbox to remember before recycling old records		["Maximum number of entries per text box"]

		nCopySubstNewLines: 0,		//What to do with newlines when copying text (one of):
									//	0 =		No change
									//	1 =		Use Windows newlines: \r\n   (CR+LF)
									//	2 =		Use OS X/Linux/Unix newlines: \n   (LF)
									//	3 =		Use Apple II/OS-9 style newlines: \r   (CR)

		nPersistStorageType: 2,		//Type of persistent storage to use (one of):
									//	0 = not to store in persistent storage (use browser's memory only)
									//	1 = localStorage
									//	2 = chrome.storage.local

		bIncogSavePersistStorage: false,	//true to allow saving of data collected from "Incognito" tabs in persistent storage. false - to save it only in the local variable (or browser memory)

		nCollectFormDataFreqMs: 5000,		//[1000 - 60000] Frequency in ms that is used to collect form data with
		nSavePersistDataFreqMs: 10000,		//[1000 - 600000] Frequency in ms that is used to save collected form data in persistent storage with

		nViewIncogData: 2,			//How to view mixed data from "Incognito" and regular tabs:
									//	0 = allow viewing mixed data
									//	1 = allow to view mixed data only in Incognito mode
									//	2 = do not allow viewing mixed data

		bUseNativeScrollbars: false	//'true' to use Chrome native scrollbars (in popup window)

		//IMPORTANT: When adding new settings make sure to check the checkAndInstantiateObjSettings() method and a possible [194] error in it!
	},
	
	gSettings_Default: null,		//Object containing a "deep" copy of 'gSettings' with its default parameters

	gstrAppName: "Formalizr",								//App name
	gstrPersistStorageKeyName: "stg",						//Key name to store 'gl.oStorage' in persistent storage under
	gstrPersistSettingsKeyName: "sttgs",					//Key name to store 'gl.gSettings' in persistent storage under
	gstrDevContact: "support@dennisbabkin.com",				//Contact email for developers (to be used in announcements & error reports)

	gnMaxExcepts: 64,				//Maximum number of allowed exceptions in 'gSettings.arrExcepts'

	gstrLastVisitedTabURL: "",			//URL of the last active, or visited tab (may be "" if not known)

	//Global value that holds which platform this app is running on
	gPlatform: 0,					//One of the following values:		
									//		= 0 if other platform
									//		= 1 if running on OS X
									//		= 2 if running on Windows
									//		= 3 if running on Linux

	gOSInfo: {						//OS info that this app runs on
		os: "",						//String that describes the OS (example: "mac", "win", "android", etc.)
		arc: ""						//Architecture (example: "arm", "x86-32", or "x86-64", etc.)
	},

	gConsoleCache: [],				//[array] Cached console.*() method submissions (used for bug reporting) -- each item is [string]
	gnMaxConsoleCacheLen: 1024,			//Maximum number of entries in 'gl.gConsoleCache' before recycling old entries




	processFormDataWithTopURL: function(data, nTabID, tabURL)
	{
		//Process data received from content page
		//'data' = data passed from content.js script as an object with the following properties:
		//			'topURL' =		[obsolete] Main page URL (same for all nested IFRAMEs) (used only as a fallback if 'tabURL' is empty)
		//			'pageURL' =		Document URL (can be empty)
		//			'pageTitle' =	Document title (can be empty)
		//			'favIconURL'=	Absolute path to the page's favorite icon
		//			'bIFrame' =		'true' if running from iFrame within page
		//			'colRes' = 		[Integer] One of the following for the result of data collection:
		//										 1 = if all available textboxes were collected
		//										 0 = if had to stop at 'nCollectMax' number textboxes but more were available
		//										 -1 = if error collecting
		//			'formData' = 	//Array with collected form data, that contains objects with the following props:
		//								'id' =	HTML id of the element
		//								'nm' =	HTML name of the element
		//								'tp' =	HTML type of the element (always lower-case). Can be one of the <input> types, as well as "textarea" or ">ce" for contentEditable element
		//								'val' =	Text in the textbox (cannot be "" or contain white-spaces)
		//'tabURL' = top URL for the tab, or empty if not known

		//Get page URL		
		var pageUrl = tabURL ? tabURL : data.topURL;				//Page URL is the same for all IFRAMEs

		//We can't do anything if we don't have page URL
		if(!pageUrl)
			return;
			
		//Get other variables
		var frameUrl = data.pageURL;			//IFRAME URL within the page concatenated with iframe index
		var bIFrame = data.bIFrame; 			//'true' if this data came from an IFRAME
		var iframeInd = data.ifrmI;				//Index of the IFRAME, or "" for main page (example: "2" or "0_4" for a nested IFRAME)
		var bIncogTab =	data.incg;				//'true' if this tab was opened for Incognito browsing

		//In case of not IFRAME, remove frameURL to simple period (this will save memory when saving in persistent storage)
		if(!bIFrame)
		{
			//Top page
			frameUrl = ".";

			//Set last visited tab URL
			gl.gstrLastVisitedTabURL = pageUrl;
		}
		else
		{
			//Add iframe index to the iframe URL
			//INFO: We need this in case several IFRAMEs within one page have the same URLs
			frameUrl = iframeInd + ">" + frameUrl;				//If change the ">" make sure to change it in fillAllFormData()
		}

		//Is collection enabled
		var bYesCollect = this.gSettings.bCollectData;

		//Check if we're allowed to collect from "Incognito" tabs
		if(bYesCollect && 
			!this.gSettings.bIncogCollectData &&
			data.incg)
		{
			//Don't collect this "Incognito" tab data
			bYesCollect = false;
		}

		//Check against exceptions
		var bExceptOn = false;

		//		= [0 and up) - index in 'gSettings.arrExcepts' array for the triggered exception, if URL did not pass -- DO NOT collect data
		//		= null - if URL passes and can be used to collect data
		if(gl.checkUrlExceptions(pageUrl) !== null)
		{
			//Do not collect
			bYesCollect = false;

			//Exception is on
			bExceptOn = true;
		}


		var objTD = null;
		var icnData = {};
		var bCollectEnabled = null;

		//Only if we're allowed to collect data
		if(bYesCollect)
		{
			//Add collected data to our tracking object
			if(nTabID in this.oTabsData)
			{
				var objPg = this.oTabsData[nTabID];

				//In case of IFRAME, the top page URL must match
				//INFO: Such situation may happen when the URL of the page is changes while we still have old IFRAMEs sending data
				if(!bIFrame ||
					objPg.pageURL == pageUrl)
				{
					//Set page URL
					objPg.pageURL = pageUrl;

					var objPgData = objPg.pageData;
	
					//Update page title?
					if(!bIFrame && data.pageTitle)
						objPgData.ttl = data.pageTitle;
	
					//Update fav icon?
					if(!bIFrame && data.favIconURL)
						objPgData.fav = data.favIconURL;
	
					//Incognito page?
					objPgData.incg = data.incg;
	
					if(objPgData.frms)
					{
						//Do we have such frame?
						if(frameUrl in objPgData.frms)
						{
							//Update existing frame for existing page
							objPgData.frms[frameUrl].dta = data.formData;
						}
						else
						{
							//Add new frame to existing page
							objPgData.frms[frameUrl] = {
								dta: data.formData
							};
						}
					}
					else
					{
						//Add frame
						var objFrame = {};
						objFrame[frameUrl] = {
							dta: data.formData								//Array of objects, each with the following properties for each textbox found:
																			//			id		= html ID of the element (can be 'null' or "" if no such)
																			//			nm		= html Name of the element (can be 'null' or "" if no such)
																			//			val		= text in the textbox (can be 'null' as well)
							};

						objPgData.frms = objFrame;
					}
				}
				else
				{
					//We're not collecting this
					//INFO: Such situation may happen when the URL of the page is changes while we still have old IFRAMEs sending data
					bYesCollect = false;
				}
			}
			else
			{
				//Add new frame
				var objFrame = {};
				objFrame[frameUrl] = {
					dta: data.formData								//Array of objects, each with the following properties for each textbox found:
																	//			id		= html ID of the element (can be 'null' or "" if no such)
																	//			nm		= html Name of the element (can be 'null' or "" if no such)
																	//			val		= text in the textbox (can be 'null' as well)
					};
				
				//Add new page
				var objPage = {
					ttl: !bIFrame ? data.pageTitle : "",			//Page title
					fav: !bIFrame ? data.favIconURL : "",			//Favorite icon (absolute) URL
					incg: data.incg,								//'true' if page was saved from the "Incognito" tab
					frms: objFrame									//Data for all frames (or at least one, with key "." for main page)
					};
				
				this.oTabsData[nTabID] = {
					bdg: {},										//Tab icon data
					pageURL: pageUrl,								//Page URL will be used as a key in the persistent storage
					injCntr: 0,										//Counter to content.js injections
					pageData: objPage								//Data for the page (that will be stored in persistent storage under the 'pageUrl' key)
				};
			}
			
			//Get object ref
			objTD = this.oTabsData[nTabID];

			//And add it to storage (also check if the list was already cut-off)
			//		 1 = if all available textboxes were collected
			//		 0 = if had to stop at 'nCollectMax' number textboxes but more were available
			//		 -1 = if error collecting
			var resAdd = this.addFormDataToStorage(objTD, data.colRes === 0);
	
			//Update result in case of a failure to collect
			if(data.colRes !== 1)
				resAdd = data.colRes;
			
			//Set flag that collection was enabled
			bCollectEnabled = true;
	
			//Count forms found
			//		= [0 and up) for number of textboxes found for the tab in 'oTabData'
			//		= -1 if error
			var nCountTxBxs = this.countTextboxesFound(objTD);

			//Remember count
			objTD.bdg.nTxbBxCnt = nCountTxBxs;

			////And set badge text
			//icnData.strIconText = nCountTxBxs > 0 ? nCountTxBxs.toString() : (nCountTxBxs === 0 ? "" : "?");

			//Set badge text color
			icnData.strIconTextClr = nCountTxBxs >= 0 && resAdd === 1 ? "#414141" : "#ff0000";

			////Set tooltip for the icon
			//icnData.strPromptText = gl.gSngltnPrmpts.strFormalizr + (bIncogTab ? gl.gSngltnPrmpts.strIncognito : "");

			//console.log(gl.getCurrentTimeUTC() + "++tabID=" + nTabID + ", cnt=" + nCountTxBxs + ", frmCnt=" +
			//	Object.keys(objTD.pageData.frms).length + ", cpyID=" + data.cpyID + ", URL=" + frameUrl + ", updates++");

		}
		else
		{
			//We're not collecting this data
			
			//See if tab is in our array
			if(!(nTabID in this.oTabsData))
			{
				//Add an empty entry
				this.oTabsData[nTabID] = {
					bdg: {},										//Tab icon data
					pageURL: pageUrl,								//Page URL will be used as a key in the persistent storage
					injCntr: 0,										//Counter to content.js injections
					pageData: {}									//No data yet (it will be filled when data is collected)
				};
			}

			//Get object ref
			objTD = this.oTabsData[nTabID];

			//Set flag that collection was disabled
			bCollectEnabled = false;

			////Save default in the global object
			//icnData.strIconText = "";

			//Reset count
			objTD.bdg.nTxbBxCnt = 0;

			//And text color
			icnData.strIconTextClr = "#414141";
			
			////Set tooltip for the icon
			//icnData.strPromptText = gl.gSngltnPrmpts.strFormalizr + (bIncogTab ? gl.gSngltnPrmpts.strIncognito : "") + " " + 
			//	(!bExceptOn ? gl.gSngltnPrmpts.strDisabled : gl.gSngltnPrmpts.strExceptOn);

			//console.log("--tabID=" + nTabID + ", not collecting--");
		}


		//Set flag that we got the data for this tab
		objTD.bdg.bDataCollected = true;

		//Set exception on flag
		objTD.bdg.bExceptOn = bExceptOn;

		//Incognito tab?
		objTD.bdg.bIncogTab = bIncogTab;

		////Determine the type of icon to show for this tab
		//if(bCollectEnabled)
		//{
		//	icnData.nIconType = !bIncogTab ? 1 : 2;		//!tab.incognito ? 1 : 2;
		//}
		//else
		//{
		//	if(!bExceptOn)
		//		icnData.nIconType = !bIncogTab ? 9 : 10;		//!tab.incognito ? 9 : 10;
		//	else
		//		icnData.nIconType = !bIncogTab ? 17 : 18;		//!tab.incognito ? 17 : 18;
		//}
	

		//Fill out data for the badge icon
		gl.getIcnData(objTD, icnData);

		//Set (default) badge icon -- it will be used if no tab is active
		//gl.updateIconAndBadge_Default(bCollectEnabled);

		//Update icon for the tab
		//'icnData' = contains props, or null not to use:
		//				'nIconType' =			[integer] Badge icon type to use for the tab. One of:
		//													0 =		gray
		//													1 =		blue (working)
		//													2 =		purple (incognito)
		//													8 =		gray - disabled
		//													9 =		blue - disabled
		//													10 =	purple (incognito) - disabled
		//													16 =	gray - exception on
		//													17 =	blue - exception on
		//													18 =	purple (incognito) - exception on
		//				'strIconText' =			[string] Currently used badge text for the tab (used to prevent repeated badge updates)
		//				'strIconTextClr' =		[string] Currently used badge text color (as "#ff0000") for the app icon (used to prevent repeated badge updates)
		//				'strPromptText' =		[string] Currently used badge tooltip prompt text for the tab (used to prevent repeated badge updates)
		gl.updateIconAndBadge(nTabID, icnData);
		
		
		//console.log("**UpdatedData: tabID=" + nTabID);

		//console.log("TabID: + " + nTabID + ", URL: \"" + pageUrl + 
		//	"\", iFrame(" + data.bIFrame + "): \"" + data.pageURL + "\", Title=\"" + data.pageTitle + 
		//	"\", fav=\"" + data.favIconURL +
		//	"\", Found elements: " + data.formData.length);

	},


	processFormData: function(data, nTabID)
	{
		//Process data received from the content page
		try
		{
			chrome.tabs.get(nTabID, function(tab)
			{
				var tabUrl = '';

				//This is an unorthodox way errors are processed here!
				//SOURCE:
				//		https://stackoverflow.com/a/28432087/843732
				if(chrome.runtime.lastError)
				{
					//Tab did not get retrieved -- mute it
				}
				else
				{
					try
					{
						tabUrl = tab.url;
					}
					catch(e)
					{
						//Failed to get tab URL -- mute it
						tabUrl = '';
					}
				}

				gl.processFormDataWithTopURL(data, nTabID, tabUrl);
			});
		}
		catch(e)
		{
			//Failed to get tab for 'nTabID' -- mute it
		}
	},
	


	//Singleton data, loaded only once
	gSngltnPrmpts: {
		strFormalizr: null,			//"Formalizr" app name for the badge icon tooltip, if not null
		strDisabled: null,			//"(Disabled)" when data collection is turned off
		strExceptOn: null,			//"(Exception)" when data collection is off because of exception
		strIncognito: null,			//"Incognito" for the tooltip

		loadSingletons: function()
		{
			//Load values in this struct
			if(this.strFormalizr === null)
				this.strFormalizr = chrome.i18n.getMessage("main_app_name");

			if(this.strExceptOn === null)
				this.strExceptOn = "(" + chrome.i18n.getMessage("prompt_Exception") + ")";

			if(this.strDisabled === null)
				this.strDisabled = "(" + chrome.i18n.getMessage("prompt_Disabled") + ")";

			if(this.strIncognito === null)
				this.strIncognito = " - " + chrome.i18n.getMessage("msg_incognito");
		}
	},
	
	
	
	addFormDataToStorage: function(itm, bAlreadyCutoff)
	{
		//'itm' = one of the elements in the 'this.oTabsData' array
		//'bAlreadyCutoff' = 'true' if the list of textbox data was cutoff due to the maximum number restriction
		//RETURN:
		//		 1 = if all available textboxes were collected
		//		 0 = if had to stop at 'nCollectMax' number textboxes but more were available
		//		 -1 = if error collecting
		var res = 1;
		
		try
		{
			//Define limits
			var nMaxPageNum = gl.gSettings.nMaxPageNum;			//[1 - 512] Maximum number of pages to save before recycling old ones								["Maximum number of pages"]
			var nMaxTxBxNum = gl.gSettings.nMaxTxBxNum;			//[1 - 128] Maximum number of textboxes per page (including all iframes in the page)				["Maximum number of text boxes per page"]
			var nMaxTxtValNum = gl.gSettings.nMaxTxtValNum;		//[1 - 256] Maximum number of text values per textbox to remember before recycling old records		["Maximum number of entries per text box"]
		
		
			var pageURL = itm.pageURL;
		
			//Get current UTC time in "ticks"
			var ticksNowUTC = this.getCurrentTimeUTC();
		
			//Do we have such page?
			if(pageURL in this.oStorage)
			{
				//Page was found
				var q = 0;

				//Local "modified" flag for the page currently processed
				var bPgModified = false;
			
				//Get page reference
				var objPg = this.oStorage[pageURL];

				//Update title or fav icon is present
				//INFO: We need to do this because page title and favIcon may change later in the page's life-cycle
				if(itm.pageData.ttl)
				{
					if(objPg.ttl != itm.pageData.ttl)
					{
						//Page title
						objPg.ttl = itm.pageData.ttl;

						//Reset "modified" flag
						bPgModified = true;
					}
				}

				if(itm.pageData.fav)
				{
					if(objPg.fav != itm.pageData.fav)
					{
						//Favorites icon for the page (absolute) URL
						objPg.fav = itm.pageData.fav;

						//Reset "modified" flag
						bPgModified = true;
					}
				}

				//Did we run out of textbox limit (while collecting data)?
				if(bAlreadyCutoff)
				{
					//Set flag
					objPg.flg |= 0x1;			//Set flag that we removed textboxes for this page
					res = 0;
				}

						
				//Go through all the iframes
				for(var frmURL in itm.pageData.frms)
				{
					//Go through all textboxes in the iframe

					//								'id' =	HTML id of the element
					//								'nm' =	HTML name of the element
					//								'tp' =	HTML type of the element (always lower-case). Can be one of the <input> types, as well as "textarea" or ">ce" for contentEditable element
					//								'si' =	[Integer] Sequential index for this textbox (can be used to uniquely ID textboxes in the iframe)
					//								'val' =	Text in the textbox (cannot be "" or contain white-spaces)
					var arrTbx = itm.pageData.frms[frmURL].dta;
					for(var t = 0; t < arrTbx.length; t++)
					{
						//Only if we have textbox data as a non-empty string
						if(arrTbx[t].val)
						{
							//Get this textbox ID
							var tbxID = this.getTbxID(arrTbx[t]);
						
							//Do we have this iframe?
							if(frmURL in objPg.frms)
							{
								//Do we have this textbox?
								if(tbxID in objPg.frms[frmURL])
								{
									//Yes, we do
									var arrTxs = objPg.frms[frmURL][tbxID].tx;
									var nNumTxs = arrTxs.length;
								
									//See if text is different since last save
									if(nNumTxs == 0 ||
										arrTxs[nNumTxs - 1].v != arrTbx[t].val)
									{
										//See if last time is different
										if(nNumTxs == 0 ||
											arrTxs[nNumTxs - 1].tm != ticksNowUTC)
										{
											//We need to add a new saved text for a time slot

											//See if we're not over the limit
											if(nNumTxs >= nMaxTxtValNum)
											{
												//Remove old records
												arrTxs.splice(0, nNumTxs - nMaxTxtValNum + 1);
											}
									
											//Add new text to the end of array
											arrTxs.push({
												tm: ticksNowUTC,		//[Integer] number of milliseconds between UTC time of saving 'v' and midnight of January 1, 1970
												v: arrTbx[t].val		//[string] text in the textbox (cannot be "" or 'null)
											});
										}
										else
										{
											//Update existing time slot
											arrTxs[nNumTxs - 1].v = arrTbx[t].val;		//[string] text in the textbox (cannot be "" or 'null)
										}
									
										//And set time saved for the page
										objPg.tm = ticksNowUTC;

										//Reset "modified" flag
										bPgModified = true;
									}
								}
								else
								{
									//We need to add new textbox
								
									//Remove existing textboxes on this page if their number exceeds the limit - 1 (for the textbox that will be added below)
									var nCntRem = this._remExtraTxbxsFromPg(objPg, nMaxTxBxNum - 1, frmURL);
								
									//Add new textbox
									objPg.frms[frmURL][tbxID] = {
										si: q + t,					//[integer] Sequential integer/index for this textbox -- trying to make it unique for all checkboxes on this page
										osi: arrTbx[t].si,			//[integer] Original sequential integer/index for this textbox, assigned by the element's order in content script
										id: arrTbx[t].id,			//[string] html ID of the element (can be 'null' or "" if no such)
										nm: arrTbx[t].nm,			//[string] html Name of the element (can be 'null' or "" if no such)
										tp: arrTbx[t].tp,			//[string] html type of the element, always lower-case (cannot be 'null' or "") -- example: "textbox", "search", "textarea", etc.
										tx: [{						//[Array of objects] Each for a textbox text and when it was saved:
											tm: ticksNowUTC,		//[Integer] number of milliseconds between UTC time of saving 'v' and midnight of January 1, 1970
											v: arrTbx[t].val		//[string] text in the textbox (cannot be "" or 'null)
										}]
									};
									
									//And set time saved for the page
									objPg.tm = ticksNowUTC;

									//Reset "modified" flag
									bPgModified = true;

									//Did we have to remove any textboxes?
									if(nCntRem > 0)
									{
										objPg.flg |= 0x1;			//Set flag that we removed textboxes for this page
										res = 0;
									}
								}
							}
							else
							{
								//Need to add a new iframe

								//Remove existing textboxes on this page if their number exceeds the limit - 1 (for the textbox that will be added below)
								var nCntRem2 = this._remExtraTxbxsFromPg(objPg, nMaxTxBxNum - 1, null);

								//Add new iframe w/this one new textbox
								var objTbxs = {};
							
								objTbxs[tbxID] = {
									si: q + t,					//[integer] Sequential integer/index for this textbox -- trying to make it unique for all checkboxes on this page
									osi: arrTbx[t].si,			//[integer] Original sequential integer/index for this textbox, assigned by the element's order in content script
									id: arrTbx[t].id,			//[string] html ID of the element (can be 'null' or "" if no such)
									nm: arrTbx[t].nm,			//[string] html Name of the element (can be 'null' or "" if no such)
									tp: arrTbx[t].tp,			//[string] html type of the element, always lower-case (cannot be 'null' or "") -- example: "textbox", "search", "textarea", etc.
									tx: [{						//[Array of objects] Each for a textbox text and when it was saved:
										tm: ticksNowUTC,		//[Integer] number of milliseconds between UTC time of saving 'v' and midnight of January 1, 1970
										v: arrTbx[t].val		//[string] text in the textbox (cannot be "" or 'null)
									}]
								};
							
								objPg.frms[frmURL] = objTbxs;
									
								//And set time saved for the page
								objPg.tm = ticksNowUTC;

								//Reset "modified" flag
								bPgModified = true;

								//Did we have to remove any textboxes?
								if(nCntRem2 > 0)
								{
									objPg.flg |= 0x1;			//Set flag that we removed textboxes for this page
									res = 0;
								}
							}
						}
					}

					//Update 'q' index
					q += 0x10000;
				}
			

				//Only if any data was "modified" for this page
				if(bPgModified)
				{
					//Incognito page status changed?
					var nIncg = itm.pageData.incg ? 0x2 : 0;			//0x2 =	set if page data came from "Incognito" tab
					if((objPg.flg & 0x2) != nIncg)
					{
						//Incognito page status changed
						if(itm.pageData.incg)
							objPg.flg |= 0x2;
						else
							objPg.flg &= ~0x2;
					}

					//Reset global "modified" flag
					gl.gbMod_oStorage = true;
				}

			}
			else
			{
				//No such page in the storage array
				var q = 0;
				var nCurTxBxCnt = 0;
				var bTooManyTxBxs = bAlreadyCutoff;
			
				//Collect frames only if they have non-empty strings
				var objFrms = {};
				for(var frmURL in itm.pageData.frms)
				{
					var objTbxs = {};
				
					//			id		= html ID of the element (can be 'null' or "" if no such)
					//			nm		= html Name of the element (can be 'null' if no such)
					//			val		= text in the textbox (can be 'null' as well)
					var arrTbx = itm.pageData.frms[frmURL].dta;
					for(var t = 0; t < arrTbx.length; t++)
					{
						//Only if we have textbox data as a non-empty string
						if(arrTbx[t].val)
						{
							//Make sure we didn't go over max textbox number (per page)
							if(nCurTxBxCnt + Object.keys(objTbxs).length > nMaxTxBxNum)
							{
								//Don't add any more
								bTooManyTxBxs = true;
								break;
							}
						
							//Add textbox data
							objTbxs[this.getTbxID(arrTbx[t])] = {
								si: q + t,					//[integer] Sequential integer/index for this textbox -- trying to make it unique for all checkboxes on this page
								osi: arrTbx[t].si,			//[integer] Original sequential integer/index for this textbox, assigned by the element's order in content script
								id: arrTbx[t].id,			//[string] html ID of the element (can be 'null' or "" if no such)
								nm: arrTbx[t].nm,			//[string] html Name of the element (can be 'null' or "" if no such)
								tp: arrTbx[t].tp,			//[string] html type of the element, always lower-case (cannot be 'null' or "") -- example: "textbox", "search", "textarea", etc.
								tx: [{						//[Array of objects] Each for a textbox text and when it was saved:
									tm: ticksNowUTC,		//[Integer] number of milliseconds between UTC time of saving 'v' and midnight of January 1, 1970
									v: arrTbx[t].val		//[string] text in the textbox (cannot be "" or 'null)
								}]
							};
						}
					}
				
					//Only if we've got any textboxes with data
					var nNumTbxs = Object.keys(objTbxs).length;
					if(nNumTbxs > 0)
					{
						//Add to frame
						objFrms[frmURL] = objTbxs;
					
						//Count number textboxes in that frame
						nCurTxBxCnt += nNumTbxs;
					}

					//Update 'q' index
					q += 0x10000;
				}
			
				//Only if we've got anything
				if(Object.keys(objFrms).length != 0)
				{
					//See how many pages do we already have?
					var nNumPgs = Object.keys(this.oStorage).length;
					if(nNumPgs >= nMaxPageNum)
					{
						//Need to remove old pages

						//Make an array
						var arrPgs = [];
						for(var pageUrl in this.oStorage)
						{
							arrPgs.push({
								pgUrl: pageUrl,
								tm: this.oStorage[pageUrl].tm   //[Integer] UTC time when page was last saved, expressed as an integer of milliseconds since midnight of January 1, 1970
							});
						}

						//Sort array by time in descending order
						arrPgs.sort(function(a, b){
							//1:    if 'a' is greater than 'b'
							//-1:   if 'a' is less than 'b'
							//0:    if 'a' is equal to 'b'
							return b.tm - a.tm;
						});

						//Remove old pages
						for(var i = arrPgs.length - 1; i >= nMaxPageNum - 1; i--)
						{
							//Remove page
							delete this.oStorage[arrPgs[i].pgUrl];
						}
					}

					//Make up flags value
					var nFlags = bTooManyTxBxs ? 0x1 : 0;

					if(itm.pageData.incg)
						nFlags |= 0x2;			//0x2 =	set if page data came from "Incognito" tab

					//Add new page
					this.oStorage[pageURL] = {
						tm: ticksNowUTC,				//UTC time when last saved, expressed as an integer of milliseconds since midnight of January 1, 1970
						flg: nFlags,					//Flags
						ttl: itm.pageData.ttl,			//Page title
						fav: itm.pageData.fav,			//Favorites icon for the page (absolute) URL
						frms: objFrms					//Object with data for all frames in its properties:
														//	Keys = Frame URLs (or "." for main page)
														//	Values = Object for each textbox data (see 'objTbxs' above)
						};

					//Reset "modified" flag
					gl.gbMod_oStorage = true;

					//Update result
					if(bTooManyTxBxs)
						res = 0;
				}
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(112, e);
			res = -1;
		}

		return res;
	},
	
	

	checkUrlExceptions: function(url)
	{
		//Checks 'url' against all exceptions
		//RETURN:
		//		= [0 and up) - index in 'gSettings.arrExcepts' array for the triggered exception, if URL did not pass -- DO NOT collect data
		//		= null - if URL passes and can be used to collect data

		try
		{
			//Get exceptions
			var xcpts = gl.gSettings.arrExcepts;
			if(url && xcpts)
			{
				var m, m_1, m_2, m_3, m_4;

				//Convert URL to lower case
				url = url.toLowerCase();

				//Go through exceptions
				for(var i = 0; i < xcpts.length; i++)
				{
					var mtch = xcpts[i].mt;		//Is always [string] and in lower case! (May be also RegExp if 'rx' is true)

					//Is it a RegExp?
					var rxp = xcpts[i].rx === true ? new RegExp(mtch, 'i') : null;		//Case-insensitive

					//	'mt'		= [string] match string, cannot be empty (always in lower case!)
					//	'rx'		= 'true' if 'mt' contains Regular Expressions, otherwise - if it's just a match string
					//	'tp'		= type of the match, one of:
					//				   INFO: We'll assume page URL is: http://www.slides.example.com:80/php/page.php?what=doc#print
					//					0	= full case-insensitive match of the entire URL
					//					1	= case-insensitive match of host name only (excluding www & port number), or: "slides.example.com"
					//					2	= case-insensitive match of host name only (excluding port number), or: "www.slides.example.com"
					//					3	= case-insensitive match of host name (excluding www & port number) + page only, or: "slides.example.com/php/page.php"
					//					4	= case-insensitive match of host name (excluding port number) + page only, or: "www.slides.example.com/php/page.php"
					switch(xcpts[i].tp)
					{
						case 0:
						{
							//0	= full case-insensitive match of the entire URL
							if(!rxp ? mtch == url : rxp.test(url))
							{
								//Matched
								return i;
							}
						}
						break;

						case 1:
						{
							//1	= case-insensitive match of host name only (excluding www), or: "dennisbabkin.com"

							if(m_1 === undefined)
							{
								//Get host from the URL (remove port number and WWW. part)
								m = url.match(/^.*\:\/\/(?:www\.)?([^\/?#:]+)/);					//If regexp is changed here, change it in toggleException() as well
								if(m && m.length > 1)
								{
									m_1 = m[1];
								}
							}

							if(!rxp ? mtch == m_1 : rxp.test(m_1))
							{
								//Matched
								return i;
							}
						}
						break;

						case 2:
						{
							//2	= case-insensitive match of host name only (excluding port number), or: "www.dennisbabkin.com"

							if(m_2 === undefined)
							{
								//Get host from the URL (remove port number)
								m = url.match(/^.*\:\/\/([^\/?#:]+)/);
								if(m && m.length > 1)
								{
									m_2 = m[1];
								}
							}

							if(!rxp ? mtch == m_2 : rxp.test(m_2))
							{
								//Matched
								return i;
							}
						}
						break;

						case 3:
						{
							//3	= case-insensitive match of host name (excluding www & port number) + page only, or: "slides.example.com/php/page.php"

							if(m_3 === undefined)
							{
								//Get host + tail from the URL (remove port number and WWW. part)
								m = url.match(/^.*\:\/\/(?:www\.)?([^\/:]+)(?:[^:]*:\d+)?([^?#]+)/);			//If regexp is changed here, change it in toggleException() as well
								if(m && m.length > 2)
								{
									//Concatenate two results, bypassing port number if there
									m_3 = m[1].toString() + m[2].toString();
								}
							}

							if(!rxp ? mtch == m_3 : rxp.test(m_3))
							{
								//Matched
								return i;
							}
						}
						break;

						case 4:
						{
							//4	= case-insensitive match of host name (excluding port number) + page only, or: "www.slides.example.com/php/page.php"

							if(m_4 === undefined)
							{
								//Get host + tail from the URL (remove port number)
								m = url.match(/^.*\:\/\/([^\/:]+)(?:[^:]*:\d+)?([^?#]+)/);
								if(m && m.length > 2)
								{
									//Concatenate two results, bypassing port number if there
									m_4 = m[1].toString() + m[2].toString();
								}
							}

							if(!rxp ? mtch == m_4 : rxp.test(m_4))
							{
								//Matched
								return i;
							}
						}
						break;

						//default:
						//{
						//	//Unsupported exception type -- may come from newer version that this version does no support
						//	console.error("[256] Bad exception type=" + xcpts[i].tp);
						//}
						//break;
					}
				}
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(320, e);
		}

		return null;
	},



	normalizeFormDataToStorage: function()
	{
		//Normalize data in the global 'gl.oTabsData' by making it fill contraints from settings
		//RETURN:
		//		= true if success
		//		= false if error
		var res = true;

		try
		{
			//Define limits
			var nMaxPageNum = gl.gSettings.nMaxPageNum;			//[1 - 512] Maximum number of pages to save before recycling old ones								["Maximum number of pages"]
			var nMaxTxBxNum = gl.gSettings.nMaxTxBxNum;			//[1 - 128] Maximum number of textboxes per page (including all iframes in the page)				["Maximum number of text boxes per page"]
			var nMaxTxtValNum = gl.gSettings.nMaxTxtValNum;		//[1 - 256] Maximum number of text values per textbox to remember before recycling old records		["Maximum number of entries per text box"]


			//See how many pages do we already have?
			var nNumPgs = Object.keys(this.oStorage).length;
			if(nNumPgs > nMaxPageNum)
			{
				//Need to remove old pages

				//Make an array
				var arrPgs = [];
				for(var pageUrl in this.oStorage)
				{
					arrPgs.push({
						pgUrl: pageUrl,
						tm: this.oStorage[pageUrl].tm   //[Integer] UTC time when page was last saved, expressed as an integer of milliseconds since midnight of January 1, 1970
					});
				}

				//Sort array by time in descending order
				arrPgs.sort(function(a, b){
					//1:    if 'a' is greater than 'b'
					//-1:   if 'a' is less than 'b'
					//0:    if 'a' is equal to 'b'
					return b.tm - a.tm;
				});

				//Remove old pages
				for(var i = arrPgs.length - 1; i >= nMaxPageNum; i--)
				{
					//Remove page
					delete this.oStorage[arrPgs[i].pgUrl];

					//Reset "modified" flag
					gl.gbMod_oStorage = true;
				}
			}


			//Go through all pages
			for(pageURL in this.oStorage)
			{
				//Get page reference
				var objPg = this.oStorage[pageURL];

				//Remove existing textboxes on this page if their number exceeds the limit
				//		= Number of textboxes removed, or
				//		= 0 if none
				var nCntRem = this._remExtraTxbxsFromPg(objPg, nMaxTxBxNum, null);
				if(nCntRem > 0)
				{
					//Reset "modified" flag
					gl.gbMod_oStorage = true;

					//Set flag that more text boxes were available (it will be shown to the user)
					//									0x1 =	set if had to stop collecting textboxes at maximum number of 'nMaxTxBxNum'
					objPg.flg |= 0x1;
				}

				//Go through all iframe for the page
				for(frmURL in objPg.frms)
				{
					var objFrm = objPg.frms[frmURL];

					//Then go through all textboxes in the iframe
					for(tbxID in objFrm)
					{
						//Get the array with textboxes text
						var arrTxs = objFrm[tbxID].tx;

						//Check its size
						var nNumTxs = arrTxs.length;
						if(nNumTxs > nMaxTxtValNum)
						{
							//Remove old records
							arrTxs.splice(0, nNumTxs - nMaxTxtValNum);

							//Reset "modified" flag
							gl.gbMod_oStorage = true;
						}
					}
				}
			}

		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(244, e);
			res = false;
		}

		return res;
	},
	
	
		
	_remExtraTxbxsFromPg: function(objPg, nLimit, frmURL_Keep)
	{
		//Remove textbox data from 'objPg' if it exceeds 'nLimit'
		//INFO: Removes if number of textboxes is greater than 'nLimit', to make it that number
		//      It removes textboxes with the oldest saved data.
		//'frmURL_Keep' = frame URL to keep (or do not delete it if becomes empty or w/o any textboxes), or null or undefined to delete any empty iframe
		//RETURN:
		//		= Number of textboxes removed, or
		//		= 0 if none
		var nCntRem = 0;

		//Get existing textboxes on this page
		var arrExstTbxs = [];
		for(var furl in objPg.frms)
		{
			var obj_frms = objPg.frms[furl];
			for(var tbid in obj_frms)
			{
				//Get array with textbox saved data
				var arr_tx = obj_frms[tbid].tx;
										
				//Pick the latest save time for this textbox (or the largest value)
				var tmLatest = arr_tx.length > 0 ? arr_tx[0].tm : 0;
				for(var y = 1; y < arr_tx.length; y++)
				{
					if(arr_tx[y].tm > tmLatest)
						tmLatest = arr_tx[y].tm;
				}
										
				//Remember data for this textbox
				arrExstTbxs.push({
					tm: tmLatest,			//Lastest save time for the textbox in ticks
					fu: furl,				//iFrame URL
					tid: tbid				//Textbox ID
					});
			}
		}
								
		//Only if we're over the limit
		if(arrExstTbxs.length > nLimit)
		{
			//Sort array in desending order by last time of saving textboxes
			arrExstTbxs.sort(function(a, b){
				//1:    if 'a' is greater than 'b'
				//-1:   if 'a' is less than 'b'
				//0:    if 'a' is equal to 'b'
				return b.tm - a.tm;
			});
									
			//And delete extra textboxes (that are the oldest)
			var frmURL;
			for(var d = arrExstTbxs.length - 1; d >= nLimit; d--)
			{
				//Get iframe URL
				frmURL = arrExstTbxs[d].fu;

				//Delete the textbox first
				delete objPg.frms[frmURL][arrExstTbxs[d].tid];
				nCntRem++;

				//See if this iframe contains any textboxes now?
				if(Object.keys(objPg.frms[frmURL]).length === 0)
				{
					//This iframe has no textboxes now
					if(!frmURL_Keep ||
						frmURL_Keep != frmURL)
					{
						//Delete this empty iframe as well
						delete objPg.frms[frmURL];
					}
				}
			}
		}
			
		return nCntRem;
	},



	getTbxID: function(obj)
	{
		//RETURN:
		//		= Textbox special ID

		//INFO: Remove spaces because they are not allowed in HTML element's ID field!
		return (obj.id ? obj.id.toString().replace(/ /g, "-") : "_") + (obj.nm ? obj.nm.toString().replace(/ /g, "-") : "_") + obj.si.toString();
	},
	
	
	countTextboxesFound: function(oTabData)
	{
		//RETURN:
		//		= [0 and up) for number of textboxes found for the tab 'oTabData'
		//		= -1 if error
		var cnt = 0;
		
		try
		{
			var oFrms = oTabData.pageData.frms;
			for(var frmURL in oFrms)
			{
				cnt += oFrms[frmURL].dta.length;
			}
		}
		catch(e)
		{
			//Error
			cnt = -1;	
		}
		
		return cnt;
	},
	

	enableDataCollection: function(bEnable)
	{
		//Enable or disable data collection
		gl.gSettings.bCollectData = bEnable ? true : false;

		//Save value in Settings in persistent storage
		gl.onPersistentSaveSettings(function(res)
		{
			if(res !== true)
			{
				//Failed saving settings
				console.error("[240] Failed to save settings: " + res);
			}

			//And update the default badge icon
			//gl.updateIconAndBadge_Default(bEnable);

			//And update icons for all open tabs
			gl.updateIconAndBadge_AllTabs();
		
			//Close all popup windows (except the active window's)
			gl.closeAllPopupWindows();

			//Set message to update Options if it's displayed
			gl.updateOptionsPage();		
		});
	},


	updateIconAndBadge_Default: function(bCollectEnabled)
	{
		//Update default look of the badge icon and text prompt
		//INFO: Does so only if they were changed since last update
		//'bCollectEnabled' = true if global data collection is enabled, false - if not

				bCollectEnabled =true;

		//Only if changed
		if(gl.oBadge.bEnabledCollect !== bCollectEnabled)
		{
			//Do it from the closure to preserve the input values
			(function()
			{
				//Remember the setting
				gl.oBadge.bEnabledCollect = bCollectEnabled;

				var objIcon = {};

				//console.log("bCollectEnabled=" + bCollectEnabled);

				//Is data collection enabled?
				if(bCollectEnabled)
				{
					//Data collection enabled -- still icon is OFF since this is a default look with tab data available!
					objIcon = {
						"19": "images/icon_off19.png",
						"38": "images/icon_off38.png"
					};
				}
				else
				{
					//Data collection disabled
					objIcon = {
						"19": "images/icon_off_no19.png",
						"38": "images/icon_off_no38.png"
					};
				}

				//And set the icon itself
				chrome.browserAction.setIcon({
					path: objIcon
				}, function()
				{
					//Check for possible errors
					if(chrome.runtime.lastError)
					{
						//Error
						console.log("[170] SetDefaultIcon failed, Desc: " + chrome.runtime.lastError.message);
					}
					else
					{
						//If success -- Update text prompt for the badge
						chrome.browserAction.setTitle({ title : gl.gSngltnPrmpts.strFormalizr + (bCollectEnabled ? "" : " " + gl.gSngltnPrmpts.strDisabled) });
					}
				});
			}());
		}
	},


	getRef_oTabsDataForTab: function(nTabID)
	{
		//Get reference to the object from 'gl.oTabsData' for 'nTabID'
		//INFO: If such tab is not in the array, creates it
		//RETURN:
		//		= Reference requested, or
		//		= null if bad tab ID

		if(nTabID === null ||
			nTabID === undefined)
			return null;

		var objTD = gl.oTabsData[nTabID];
		if(!objTD)
		{
			//Empty tab, add it
			objTD = gl.oTabsData[nTabID] = {
				bdg: {},										//Tab icon data
				pageURL: "",									//Page URL will be used as a key in the persistent storage
				injCntr: 0,										//Counter to content.js injections
				pageData: {}									//No data yet (it will be filled when data is collected)
			};
		}

		return objTD;
	},

	isTabDataCollected: function(nTabID)
	{
		//RETURN:
		//		= true if data was collected for the tab (note that it doesn't mean that data collection was turned on)
		//		= false if data was not collected
		//		= null if error (such as no tab)

		var objTD = gl.oTabsData[nTabID];
		if(objTD)
		{
			return objTD.bdg.bDataCollected ? true : false;
		}

		return null;
	},


	closeAllPopupWindows: function(bIncludeActive)
	{
		//Close all open popup windows
		//'bIncludeActive' = true if also close the popup for the active window, otherwise it's kept open
		//Get active window
		try
		{
			chrome.windows.getLastFocused({ populate: false }, function(wndA)
			{
				//Get active window ID
				var nActvID = wndA ? wndA.id : 0;
			
				//Enumerate all windows
				chrome.windows.getAll({populate : false}, function(arrWnds)
				{
					//Go through all
					for(var w = 0; w < arrWnds.length; w++)
					{
						//Make sure it's not the active window
						var wid = arrWnds[w].id;
						if(bIncludeActive ||
							wid != nActvID)
						{
							//Get its popup view
							var rr = 0;
						
							//Get popup view for the window
							arrHtmlWnds = chrome.extension.getViews({ windowId: wid, type: 'popup'});
						
							if(arrHtmlWnds)
							{
								//Close them all (technically should be only one)
								for(var i = 0; i < arrHtmlWnds.length; i++)
								{
									arrHtmlWnds[i].close();
								}
							}
						}
					}
				});
			
			});
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(178, e);
		}
	},



	updateActiveTabIconAndBadge: function()
	{
		//Update icon badge for the active tab
		try
		{
			//Get active tab
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
			{
				if(chrome.runtime.lastError)
				{
					//Some failure -- mute it
				}
				else
				{
					//Send message to do the work
					gl.updateIconAndBadge_Tab(tabs[0].id);
				}
			});

		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(155, e);
		}
		
	},
	
	updateIconAndBadge_AllTabs: function()
	{
		//Update icon badge for all tabs
		try
		{
			//Get all windows
			chrome.windows.getAll({populate: true}, function(wnds)
			{
				//Go through all windows
				for(var w = 0; w < wnds.length; w++)
				{
					var tabs = wnds[w].tabs;

					//Go through all tabs in a window
					for(var t = 0; t < tabs.length; t++)
					{
						//Update this tab's icon
						gl.updateIconAndBadge_Tab(tabs[t].id);
					}
				}
			});
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(177, e);
		}
		
	},


	updateIconAndBadge_Tab: function(nTabID)
	{
		//Update app badge icon
		//INFO: Does so only if values are different than the last ones
		//'nTabID' = tab ID to update (cannot be 'null')

		//Get object reference in cache
		var objTD = gl.getRef_oTabsDataForTab(nTabID);
		if(objTD)
		{
			var icnData = {};

			////Is collection enabled
			//var bYesCollect = gl.gSettings.bCollectData;

			////Check if we're allowed to collect from "Incognito" tabs
			//if(bYesCollect && 
			//	!gl.gSettings.bIncogCollectData &&
			//	objTD.bdg.bIncogTab)
			//{
			//	//Don't collect this "Incognito" tab data
			//	bYesCollect = false;
			//}
			//else
			//{
			//	//Don't collect if exception is on
			//	if(objTD.bdg.bExceptOn)
			//		bYesCollect = false;
			//}

			////Determine the type of icon to show for this tab
			//if(bYesCollect)
			//{
            //    //Collection is enabled
			//	icnData.nIconType = !objTD.bdg.bIncogTab ? 1 : 2;

			//	//Set number of items
			//	var nCountTxBxs = objTD.bdg.nTxbBxCnt;
			//	if(nCountTxBxs !== undefined)
			//	    icnData.strIconText = nCountTxBxs > 0 ? nCountTxBxs.toString() : (nCountTxBxs === 0 ? "" : "?");

			//	//Set tooltip for the icon
			//	icnData.strPromptText = gl.gSngltnPrmpts.strFormalizr + (objTD.bdg.bIncogTab ? gl.gSngltnPrmpts.strIncognito : "");
			//}
			//else
			//{
			//	//Collection is disabled, is it because of exception?
			//	if(!objTD.bdg.bExceptOn)
			//		icnData.nIconType = !objTD.bdg.bIncogTab ? 9 : 10;
			//	else
			//		icnData.nIconType = !objTD.bdg.bIncogTab ? 17 : 18;

			//	//Also reset number of items
			//	icnData.strIconText = "";

			//	//Set tooltip for the icon
			//	icnData.strPromptText = gl.gSngltnPrmpts.strFormalizr + (objTD.bdg.bIncogTab ? gl.gSngltnPrmpts.strIncognito : "") + " " +
			//		(!objTD.bdg.bExceptOn ? gl.gSngltnPrmpts.strDisabled : gl.gSngltnPrmpts.strExceptOn);
			//}

			//console.log("tabID=" + nTabID + ", iconType=" + icnData.nIconType);

			//Fill out data for the badge icon
			gl.getIcnData(objTD, icnData);

			//Set icon
			//				'nIconType' =			[integer] Suggested badge icon type to use for the tab (can be overridden by 'bdg.bDataCollected' param). One of:
			//													0 =		gray
			//													1 =		blue (working)
			//													2 =		purple (incognito)
			//													8 =		gray - disabled
			//													9 =		blue - disabled
			//													10 =	purple (incognito) - disabled
			//													16 =	gray - exception on
			//													17 =	blue - exception on
			//													18 =	purple (incognito) - exception on
			gl.updateIconAndBadge(nTabID, icnData);
		}
		else
		{
			//Bad tab ID
			console.error("[176] ERR: Tab data missing, tabID=" + nTabID);
		}
	},



	getIcnData: function(objTD, icnData)
	{
		//Compose data for the updateIconAndBadge() method
		//'objTD' = info to use, is an element from 'gl.oTabsData' object -- must be provided!
		//'icnData' = object to fill out, must be initialized as {} or with some initial values

		//Cache values
		var bIncog = objTD.bdg.bIncogTab;
		var bExcept = objTD.bdg.bExceptOn;

		//Is collection enabled
		var bYesCollect = gl.gSettings.bCollectData;
		var bAllowCollect = bYesCollect;

		//Check if we're allowed to collect from "Incognito" tabs
		if(bYesCollect && 
			!gl.gSettings.bIncogCollectData &&
			bIncog)
		{
			//Don't collect this "Incognito" tab data
			bYesCollect = false;
			bAllowCollect = false;
		}

		//If collecting, then check against exceptions
		if(bYesCollect)
		{
			//Is exception on for this tab?
			if(bExcept)
			{
				//Do not collect
				bYesCollect = false;
			}
		}


		//Only if we're allowed to collect data
		if(bYesCollect)
		{
			//Collecting data for this tab

			//Define an icon
			icnData.nIconType = !bIncog ? 1 : 2;		//!tab.incognito ? 1 : 2;

			//Number of text boxes
			var nCountTxBxs = objTD.bdg.nTxbBxCnt;

			//And set badge text
			if(nCountTxBxs !== undefined)
			{
				icnData.strIconText = nCountTxBxs > 0 ? nCountTxBxs.toString() : (nCountTxBxs === 0 ? "" : "?");
			}

			//Set tooltip for the icon
			icnData.strPromptText = gl.gSngltnPrmpts.strFormalizr + (bIncog ? gl.gSngltnPrmpts.strIncognito : "");
		}
		else
		{
			//Not collecting data from this tab

			//Define an icon
			if(!bAllowCollect || !bExcept)
				icnData.nIconType = !bIncog ? 9 : 10;		//!tab.incognito ? 9 : 10;
			else
				icnData.nIconType = !bIncog ? 17 : 18;		//!tab.incognito ? 17 : 18;

			//No icon text
			icnData.strIconText = "";
			
			//Set tooltip for the icon
			icnData.strPromptText = gl.gSngltnPrmpts.strFormalizr + (bIncog ? gl.gSngltnPrmpts.strIncognito : "") + " " + 
				(!bExcept ? gl.gSngltnPrmpts.strDisabled : gl.gSngltnPrmpts.strExceptOn);
		}

		//				'nIconType' =			[integer] Suggested badge icon type to use for the tab (can be overridden by 'bdg.bDataCollected' param). One of:
		//													0 =		gray
		//													1 =		blue (working)
		//													2 =		purple (incognito)
		//													8 =		gray - disabled
		//													9 =		blue - disabled
		//													10 =	purple (incognito) - disabled
		//													16 =	gray - exception on
		//													17 =	blue - exception on
		//													18 =	purple (incognito) - exception on
		return icnData;
	},



	updateIconAndBadge: function(nTabID, iconData)
	{
		//Update app badge icon, its text, color & prompt
		//INFO: Does so only if values are different than the last ones
		//'nTabID' = tab ID to update (cannot be 'null')
		//'iconData' = data to update if any of the following props are not 'null':
		//				'nIconType' =			[integer] Suggested badge icon type to use for the tab (can be overridden by 'bdg.bDataCollected' param). One of:
		//													0 =		gray
		//													1 =		blue (working)
		//													2 =		purple (incognito)
		//													8 =		gray - disabled
		//													9 =		blue - disabled
		//													10 =	purple (incognito) - disabled
		//													16 =	gray - exception on
		//													17 =	blue - exception on
		//													18 =	purple (incognito) - exception on
		//				'strIconText' =			[string] Currently used badge text for the tab (used to prevent repeated badge updates)
		//				'strIconTextClr' =		[string] Currently used badge text color (as "#ff0000") for the app icon (used to prevent repeated badge updates)
		//				'strPromptText' =		[string] Currently used badge tooltip prompt text for the tab (used to prevent repeated badge updates)

		//Get object reference in cache
		var objTD = gl.oTabsData[nTabID];
		if(objTD &&
			iconData)
		{
			//In case we do not have collected icon data
			var nIconType;
			if(objTD.bdg.bDataCollected)
			{
				//Use provided icon type
				nIconType = iconData.nIconType;
			}
			else
			{
				//Reset icon type to a "gray" one
				if(iconData.nIconType !== undefined)
					nIconType = iconData.nIconType >= 16 ? 16 : (iconData.nIconType >= 8 ? 8 : 0);
				else if(objTD.bdg.nIconType !== undefined)
					nIconType = objTD.bdg.nIconType >= 16 ? 16 : (objTD.bdg.nIconType >= 8 ? 8 : 0);
				else
					nIconType = 0;
			}

			//Do we need to set the icon params & is at least one of them different than its last value?
			if(
				(nIconType !== undefined && nIconType !== objTD.bdg.nIconType) ||
				(iconData.strIconText !== undefined && iconData.strIconText !== objTD.bdg.strIconText) ||
				(iconData.strIconTextClr !== undefined && iconData.strIconTextClr !== objTD.bdg.strIconTextClr) ||
				(iconData.strPromptText !== undefined && iconData.strPromptText !== objTD.bdg.strPromptText)
			)
			{
				//Go into a closure to preserve the input params
				(function()
				{
					////Log what caused the update
					//console.log("[174] " + (gl.getCurrentTimeUTC() % 100) +  " AppIcon updated: nTabID=" + nTabID + ", " +
					//	(nIconType !== undefined ? "icn=" + objTD.bdg.nIconType + "->" + nIconType + ", " : "") +
					//	(iconData.strIconText !== undefined ? "txt='" + objTD.bdg.strIconText + "'->'" + iconData.strIconText + "', " : "") +
					//	(iconData.strIconTextClr !== undefined ? "txtClr=" + objTD.bdg.strIconTextClr + "->" + iconData.strIconTextClr + ", " : "") +
					//	(iconData.strPromptText !== undefined ? "prmpt='" + objTD.bdg.strPromptText + "'->'" + iconData.strPromptText + "'" : "")
					//	);


					//Remember old values to prevent repeated updates while this method runs (some of it asynchronously)
					if(nIconType !== undefined)
						objTD.bdg.nIconType = nIconType;

					if(iconData.strIconText !== undefined)
						objTD.bdg.strIconText = iconData.strIconText;

					if(iconData.strIconTextClr !== undefined)
						objTD.bdg.strIconTextClr = iconData.strIconTextClr;

					if(iconData.strPromptText !== undefined)
						objTD.bdg.strPromptText = iconData.strPromptText;


					//console.log("icn=" + gl.oTabsData[nTabID].bdg.nIconType + 
					//	", txt=" + gl.oTabsData[nTabID].bdg.strIconText + 
					//	", clr=" + gl.oTabsData[nTabID].bdg.strIconTextClr + 
					//	", prmpt=" + gl.oTabsData[nTabID].bdg.strPromptText
					//	);


					var objIcon = {};
					var nIcnType = objTD.bdg.nIconType;

					//Define which icon to show
					switch(nIcnType)
					{
						case 1:			//1 =		blue (working)
						{
							objIcon = {
								"19": "images/icon19.png",
								"38": "images/icon38.png"
							};
						}
						break;

						case 2:			//2 =		purple (incognito)
						{
							objIcon = {
								"19": "images/icon_incog19.png",
								"38": "images/icon_incog38.png"
							};
						}
						break;

						case 8:			//8 =		gray - disabled
						{
							objIcon = {
								"19": "images/icon_off_no19.png",
								"38": "images/icon_off_no38.png"
							};
						}
						break;

						case 9:			//9 =		blue - disabled
						{
							objIcon = {
								"19": "images/icon_no19.png",
								"38": "images/icon_no38.png"
							};
						}
						break;

						case 10:		//10 =	purple (incognito) - disabled
						{
							objIcon = {
								"19": "images/icon_incog_no19.png",
								"38": "images/icon_incog_no38.png"
							};
						}
						break;

						case 16:		//16 =	gray - exception on
						{
							objIcon = {
								"19": "images/icon_off_xcpt19.png",
								"38": "images/icon_off_xcpt38.png"
							};
						}
						break;

						case 17:		//17 =	blue - exception on
						{
							objIcon = {
								"19": "images/icon_xcpt19.png",
								"38": "images/icon_xcpt38.png"
							};
						}
						break;

						case 18:		//18 =	purple (incognito) - exception on
						{
							objIcon = {
								"19": "images/icon_incog_xcpt19.png",
								"38": "images/icon_incog_xcpt38.png"
							};
						}
						break;

						default:		//0 =		gray
						{
							objIcon = {
								"19": "images/icon_off19.png",
								"38": "images/icon_off38.png"
							};

							if(nIcnType !== 0)
							{
								console.error("[173] Bad icon type=" + nIcnType);
							}
						}
						break;
					}


					//Set icon
					chrome.browserAction.setIcon({
						path: objIcon,
						tabId: nTabID
					}, function()
					{
						//Check for possible errors
						if(chrome.runtime.lastError)
						{
							//Error
							//console.log("[172] SetIcon failed nTabID=" + nTabID + ", Desc: " + chrome.runtime.lastError.message);

							//Reset global objects
							objTD.bdg.nIconType = null;
							objTD.bdg.strIconText = null;
							objTD.bdg.strIconTextClr = null;
							objTD.bdg.strPromptText = null;
						}
						else
						{
							//Set icon OK, can continue

							//Do we need to update the badge text?
							if(iconData.strIconText !== undefined)
							{
								//Set badge text
								chrome.browserAction.setBadgeText({ text: iconData.strIconText, tabId: nTabID });
							}

							//Do we need to update the text color
							if(iconData.strIconTextClr !== undefined)
							{
								//Set badge text color
								chrome.browserAction.setBadgeBackgroundColor({ color: iconData.strIconTextClr, tabId: nTabID });
							}

							//Do we need to update the tootip prompt
							if(iconData.strPromptText !== undefined)
							{
								//Set badge tooltip
								chrome.browserAction.setTitle({ title : iconData.strPromptText, tabId : nTabID });
							}

						}
					});
				}());
			}
		}
		else
		{
			//Error
			console.error("[171] ERR: Tab data missing, tabID=" + nTabID + ", iconData=" + iconData);
		}
	},


	
	
	
	logReport: function(strMsg)
    {
		//Log report info debugger console
		if(strMsg)
			console.log(strMsg);
	},

	logWarning: function(strMsg)
	{
		//Log warning info debugger console
		if(strMsg)
			console.warn(strMsg);
	},

	logError: function(strMsg)
	{
		//Log error info debugger console
		if(strMsg)
			console.error(strMsg);
	},


	logExceptionReport: function(specErr, err)
	{
		//Log exception into debugger console
		var __s = "ERROR[" + specErr + "]: ";
		
		if(err.stack)
		{
			//Use stack since it contains additional stuff, like line numbers
			__s += err.stack;
		}
		else
		{
			//Otherwise just use the error message
			__s += err.message;
		}
		
		console.error(__s);
	},
	

	overrideGlobConsole: function()
	{
		//Override global console calls

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
					gl._logGlobConsole("", arguments[0]);
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
					gl._logGlobConsole("Warn", arguments[0]);
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
					gl._logGlobConsole("ERR", arguments[0]);
				}
			}
		}
	},
	_fnConsoleLog: null,		//[Used internally]
	_fnConsoleWarn: null,		//[Used internally]
	_fnConsoleErr: null,		//[Used internally]
	
	_logGlobConsole: function(strType, strMsg)
	{
		//Add 'strMsg' to the global console cache
		//INFO: It is used for bug reports
		try
		{
			if(gl.gConsoleCache.length + 1 > gl.gnMaxConsoleCacheLen)
			{
				//Remove old entries
				gl.gConsoleCache.splice(0, gl.gConsoleCache.length + 1 - gl.gnMaxConsoleCacheLen);
			}

			//Get current time (local)
			var dt = new Date();

			//Add new
			gl.gConsoleCache.push(dt.getFullYear() + "/" + (dt.getMonth() + 1).toString() + "/" + dt.getDate() + " " +
				dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + "." + dt.getMilliseconds() + 
				"> " + (strType ? "[" + strType + "]: " : "") + strMsg);
		}
		catch(e)
		{
			//Do not report it -- since we may be calling our method repeatedly if so!
		}
	},


	getConsoleCacheAsStr:function(bSanitize)
	{
		//'bSanitize' = true to "sanitize" data by removing all links
		//RETURN:
		//		= Contents of global console cache as a string
		//		= null if error
		var res = "";

		try
		{
			//Go through all items
			var msg;
			for(var i = 0; i < gl.gConsoleCache.length; i++)
			{
				msg = gl.gConsoleCache[i];

				if(bSanitize)
				{
					//Sanitize this string
					msg = gl._sanitizeUrlsInStr(msg);
				}

				if(msg)
				{
					res += msg + "\n";
				}
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(309, e);
			res = null;
		}

		return res;
	},


	
	updateInfoFromActiveTab: function(callbackDone)
	{
		//Need to update the active tab
		//'callbackDone' = if specified, must point to 'function(result)' that is called when message is processed by at lease one IFRAME 
		//				   or in case of an error, where 'result' can be:
		//					- 'true' if update was successful,
		//					- 'false' if error
		//					- String as error description

		try
		{
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
			{
				if(chrome.runtime.lastError)
				{
					//Failure
					if(callbackDone)
						callbackDone(false);
				}
				else
				{
					var nActvTabId;
					var bGotActiveTabID = false;
					
					try
					{
						nActvTabId = tabs[0].id;
						bGotActiveTabID = true;
					}
					catch(e)
					{
						//There's no active tab -- like when an special Chrome window is shown instead
						//INFO: Also no need to log exceptions here....
					}
					
					if(bGotActiveTabID)
					{
						//Update that tab
						gl.updateInfoFromTab(nActvTabId, callbackDone);
					}
					else
					{
						//Notify callback of a failure
						if(callbackDone)
							callbackDone(false);
					}
				}
			});
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(104, e);
			
			//Do we have a callback method?
			if(callbackDone)
				callbackDone(false);
		}
	},
	
	
	
	updateInfoFromTab: function(nTabID, callbackDone)
	{
		//Need to update the tab with 'nTabID'
		//'nTabID' = tab ID, cannot be null!
		//'callbackDone' = if specified, must point to 'function(result)' that is called when message is processed by at least one IFRAME
		//				   or in case of an error, where 'result' can be:
		//					- 'true' if update was successful,
		//					- String with error description

		// More info on callbacks:    http://stackoverflow.com/questions/3458553/javascript-passing-parameters-to-a-callback-function
		
		try
		{
			if(nTabID !== null)
			{
				//Create a closure to preserve 'nTabID'
				(function()
				{
					//Pick this tab from our cache
					var objTD = gl.getRef_oTabsDataForTab(nTabID);

					//Reset global flag that tab data is collected
					objTD.bdg.bDataCollected = false;
			
					//Send message to the content.js to collect the data
					//INFO: It is sent to all iframes in the currently open page
					chrome.tabs.sendMessage(nTabID, {
						action: "update02", 
						retRes: callbackDone ? true : false,
						sttgs: gl.getSettingsForContent()
						}, 
						function(response) 
					{
						//Check if we failed to send message to this tab
						if(!chrome.runtime.lastError &&
							response &&
							response.res === 535)		//Special success code
						{
							//Processed message OK

							//Reset injection counter
							objTD.injCntr = 0;

							//Finalize it
							gl._after_updateInfoFromTab(nTabID, callbackDone, response);
						}
						else
						{
							//Failed to send message to the page
							//console.error("nTabID=" + nTabID + ". ERR SendMessage: " + chrome.runtime.lastError.message);

							//Retrieve last error (so that it's not reported in the console as error)
							//var strLastErr = chrome.runtime.lastError ? chrome.runtime.lastError.message : "";

							//Try to inject the content script again a little bit later
							window.setTimeout(function(objTd)
							{
								//See if the counter of injections is not over the limit
								if(objTd.injCntr < 8)
								{
									//Increment count
									objTd.injCntr++;

									//Read out manifest.json
									var manifest = chrome.runtime.getManifest();
									var objCSs = manifest.content_scripts[0];

									//Try to inject the content script again
									chrome.tabs.executeScript(nTabID, {
										file: objCSs.js[0],
										allFrames: objCSs.all_frames,
										matchAboutBlank: objCSs.match_about_blank
										}, function(arrRes)
									{
										//After the scripts were injected, or if an error occurred
										if(chrome.runtime.lastError)
										{
											//Failed -- this may be because the tab did not fit the "matches" clause in the manifest.json
											//INFO: So we'll go with just ignoring this exception until a better solution is known!
											//More info:	http://stackoverflow.com/q/25839547/843732

											//console.error("INJ ERR: " + chrome.runtime.lastError.message);

											//Process callback
											if(callbackDone)
												callbackDone("[163] ERR: Inj. arrRes=" + arrRes + ", err=" + 
													(chrome.runtime.lastError ? chrome.runtime.lastError.message : "-"));
										}
										else
										{
											//Injected OK, try sending message again
											chrome.tabs.sendMessage(nTabID, {
												action: "update02", 
												retRes: callbackDone ? true : false,
												sttgs: gl.getSettingsForContent()
												}, 
												function(response2) 
											{
												//Check result
												if(response2 &&
													response2.res === 535)		//Special success code
												{
													//This time processed OK

													//Reset injection counter
													objTd.injCntr = 0;

													//Finalize it
													gl._after_updateInfoFromTab(nTabID, callbackDone, response2);
												}
												else
												{
													//Still failed
													console.error("[164] INJ ERR: " + (chrome.runtime.lastError ? chrome.runtime.lastError.message : "-"));
												}
											});
										}

										return;
									});
								}
								else
								{
									//We're over the limit of successive failed injections!
									if(callbackDone)
										callbackDone("[264] INJ ERR: Cntr=" + objTd.injCntr);
								}
							},
							100,		//100 ms delay
							objTD);

							return;
						}

						return;
					});
				})();
			}
            else
			{
			    //Error
				console.error("[160] Null tab");
				
				//Can't update tab since we don't have one!

				//Process callback
				if(callbackDone)
					callbackDone("[161] ERR: Null");
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(107, e);
					
			//Update icon
			gl.updateIconAndBadge_Tab(nTabID);
					
			//Process callback
			if(callbackDone)
				callbackDone("[162] ERR: " + e.message);
		}
		
	},

	_after_updateInfoFromTab: function(nTabID, callbackDone, response)
	{
		if(response &&
			response.res === 535)			//Special success code
		{
			//Do we need to process it?
			if(response.resData)
			{
				//Got data in response itself

				//console.log(">>Update-RSP: tabID=" + nTabID);
							
				////Get tab from tabID
				//chrome.tabs.get(nTabID, function(tab)
				//{
					//Process it
					gl.processFormData(response.resData, nTabID);
														
					//Update the badge
					gl.updateIconAndBadge_Tab(nTabID);

					//Process callbacl
					if(callbackDone)
						callbackDone(true);
				//});
			}
			else
			{
				//We'll receive a response in a separate message -- no callback in this case

				//console.log(">>Update-MSG: tabID=" + nTabID);
							
				//Update the badge
				gl.updateIconAndBadge_Tab(nTabID);

				//Process callback
				if(callbackDone)
					callbackDone(true);
			}
		}
		else
		{
			//Did not update -- error
						
			//console.log(">>Update-Nul: tabID=" + nTabID);
						
			//Update the badge
			gl.updateIconAndBadge_Tab(nTabID);
						
			//Process callback
			if(callbackDone)
				callbackDone(false);
		}
	},


	fillAllFormData: function(data)
	{
		//Fill all form data for the currently active tab
		//'data' = object with data to fill:
		//				Keys = 		Frame URLs + frame indexes (or "." for the main page)
		//				Values = 	Array of objects for each textbox data with the following properties:
		//								'si'	[integer] Sequential integer/index for this textbox -- trying to make it unique for all checkboxes on this page
		//								'id'	[string] html ID of the element (can be 'null' or "" if no such)
		//								'nm'	[string] html Name of the element (can be 'null' or "" if no such)
		//								'tp'	[string] html type of the element, always lower-case (cannot be 'null' or "") -- example: "textbox", "search", "textarea", etc.
		//								'v'		[string] text for the element to fill with

		try
		{
			//Get active tab
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
			{
				if(chrome.runtime.lastError)
				{
					//Failed
					console.log("[326] Error filling form data in content script")
				}
				else
				{
					//Send message to do the work
					var response = null;
					chrome.tabs.sendMessage(tabs[0].id, {action: "fill01", data: data}, function(response) 
					{
						//Received response -- it must be 'true' if no errors!
						if(chrome.runtime.lastError ||
							!response ||
							response.res !== true)
						{
							//Error in content script
							console.log("[121] Error filling form data in content script")
						}
					});
				}
			});

		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(120, e);
		}
	},



	getMinMaxSettingsVals: function()
	{
		//Object with min and max values for settings
		//RETURN:
		//		= Object with keys for prop names, and values with props:
		//			'min' = minimum allowed value (inclusively)
		//			'max' = maximum allowed value (inclusively)

		return {
//		nMaxPageNum: 48,			//[1 - 512] Maximum number of pages to save before recycling old ones								["Maximum number of pages"]
			nMaxPageNum: {min: 1, max: 512},
//		nMaxTxBxNum: 32,			//[1 - 128] Maximum number of textboxes per page (including all iframes in the page)				["Maximum number of text boxes per page"]
			nMaxTxBxNum: {min: 1, max: 128},
//		nMaxTxtValNum: 32,			//[1 - 256] Maximum number of text values per textbox to remember before recycling old records		["Maximum number of entries per text box"]
			nMaxTxtValNum: {min: 1, max: 256},
//		nCopySubstNewLines: 1,		//What to do with newlines when copying text (one of):
//									//	0 =		No change
//									//	1 =		Use Windows newlines: \r\n
//									//	2 =		Use OS X/Linux/Unix newlines: \n
//									//	3 =		Use Apple II/OS-9 style newlines: \r
			nCopySubstNewLines: {min: 0, max: 3},
//		nPersistStorageType: 2,		//Type of persistent storage to use (one of):
//									//	0 = not to store in persistent storage (use browser's memory only)
//									//	1 = localStorage
//									//	2 = chrome.storage.local
			nPersistStorageType: {min: 0, max: 2},
//		nCollectFormDataFreqMs: 5000,		//[1000 - 60000] Frequency in ms that is used to collect form data with
			nCollectFormDataFreqMs: {min: 1000, max: 60000},
//		nSavePersistDataFreqMs: 10000,		//[1000 - 600000] Frequency in ms that is used to save collected form data in persistent storage with
			nSavePersistDataFreqMs: {min: 1000, max: 600000},
//		nViewIncogData: 0			//How to view mixed data from "Incognito" and regular tabs:
//									//	0 = allow viewing mixed data
//									//	1 = allow to view mixed data only in Incognito mode
//									//	2 = do not allow viewing mixed data
			nViewIncogData: {min: 0, max: 2},

//	'tp'		= type of the match, one of:
//				   INFO: We'll assume page URL is: http://www.slides.example.com:80/php/page.php?what=doc#print
//					0	= full case-insensitive match of the entire URL
//					1	= case-insensitive match of host name only (excluding www & port number), or: "slides.example.com"
//					2	= case-insensitive match of host name only (excluding port number), or: "www.slides.example.com"
//					3	= case-insensitive match of host name (excluding www & port number) + page only, or: "slides.example.com/php/page.php"
//					4	= case-insensitive match of host name (excluding port number) + page only, or: "www.slides.example.com/php/page.php"
			arrExcepts: {tp: {min: 0, max: 4}}

		};

	},
	
	
	checkAndInstantiateObjSettings: function(data)
	{
		//Checks that 'data' is a valid settings object and sets 'gl.gSettings' if yes
		//'data' = data loaded from 'chrome.storage.sync' to be used for checking as it was read from persistent storage
		//			INFO: This object may be modified when this function returns even if result is not 'true'!
		//RETURN:
		//		= object with data to use - if data was accepted
		//		= null if error in data
		var res = null;

		try
		{
			var toStr = Object.prototype.toString;

			if(data !== null && 
				typeof data === 'object')
			{
				//Check all props (against the default object settings)
				for(var propName in gl.gSettings_Default)
				{
					//Do we have such prop
					if(propName in data)
					{
						//Make sure type is the same
						if(toStr.call(data[propName]) !== toStr.call(gl.gSettings_Default[propName]))
						{
							//Mismatched type
							console.warn("[195] SttgsObj_ParseErr: Wrong type for '" + propName + "'=" + toStr.call(data[propName]));
							return null;
						}
					}
					else
					{
						//No such prop, issue only a warning -- don't stop (as we might have different versions issues here)
						console.warn("[194] SttgsObj_ParseWarn: Prop missing='" + propName + "'");

						//Set its value from defaults
						data[propName] = gl.gSettings_Default[propName];
					}
				}

			
				//Check specific values for min/max match
				var objMinMax = gl.getMinMaxSettingsVals();
				
				for(var nm in objMinMax)
				{
					var oMMx = objMinMax[nm];

					//Make sure we have both props in min/max array
					if(oMMx.min !== undefined &&
						oMMx.max !== undefined)
					{
						//Adjust if needed
						if(data[nm] < oMMx.min)
						{
							//Value is too small
							console.warn("[198] SttgsObj_ParseWarn: Adjusted '" + nm + "' from '" + data[nm] + "' to '" + oMMx.min + "'");
						
							data[nm] = oMMx.min;						
						}
						else if(data[nm] > oMMx.max)
						{
							//Value is too large
							console.warn("[199] SttgsObj_ParseWarn: Adjusted '" + nm + "' from '" + data[nm] + "' to '" + oMMx.max + "'");
						
							data[nm] = oMMx.max;						
						}
					}
					//else
					//{
					//console.error("nm=" + nm);
					//}
				}


				//Get version number of the settings data passed
				//		= 0 if both are the same
				//		= 1 if v1 > v2
				//		= -1 if v1 < v2
				//		= NaN if error
				var resVC_1_0_0_2 = gl.compareVersions(data.appVersion, '1.0.0.2');
				if(isNaN(resVC_1_0_0_2))
				{
					//Error
					console.warn("[321] SttgsObj_ParseErr: Bad version=" + data.appVersion);
					return null;
				}

				//Check exceptions array
				var xcpts = data.arrExcepts;
				if(xcpts && toStr.call(xcpts) === '[object Array]')
				{
					for(var e = 0; e < xcpts.length; e++)
					{
						var objXcpt = xcpts[e];

						//For earlier versions (prior to v.1.0.0.2)
						if(resVC_1_0_0_2 === -1)
						{
							//Init param, since it wasn't in previous version
							objXcpt.rx = false;		//Previous versions did not support RegExps
						}

						//Check that element has both props
						if(!gl._checkAndInitProp_String(toStr, objXcpt, 'mt', false) ||			//Cannot be empty!
							!gl._checkAndInitProp_Int(toStr, objXcpt, 'tp') ||
							!gl._checkAndInitProp_Bool(toStr, objXcpt, 'rx'))
						{
							//Bad prop
							console.warn("[258] SttgsObj_ParseErr: For arrExcepts[" + e + "]: " +
								"mt='" + objXcpt.mt + "' (" + (objXcpt.mt ? toStr.call(objXcpt.mt) : "-") + "), " + 
								"rx='" + objXcpt.rx + "' (" + (objXcpt.rx ? toStr.call(objXcpt.rx) : "-") + "), " +
								"tp='" + objXcpt.tp + "' (" + (objXcpt.tp ? toStr.call(objXcpt.tp) : "-") + ")");

							return null;
						}

						//In case of a regular expression
						if(objXcpt.rx === true)
						{
							//Check that it's valid
							if(!gl.isRegExpValid(objXcpt.mt))
							{
								//RegExp is not valid
								console.warn("[322] SttgsObj_ParseErr: For arrExcepts[" + e + "]: Bad RegExp=" + objXcpt.mt);
								return null;
							}
						}
					}
				}
				else
				{
					//Bad exceptions array
					console.warn("[257] SttgsObj_ParseErr: Wrong type for 'arrExcepts'=" + (xcpts ? toStr.call(xcpts) : "-"));
					return null;
				}
				

//data.arrExcepts.push({
//	mt:	"http://www.msn.com/",		//[string] match string, cannot be empty (always in lower case!)
//	tp: 0		//type of the match
//});
//data.arrExcepts.push({
//	mt:	"amazon.com",		//[string] match string, cannot be empty (always in lower case!)
//	tp: 1		//type of the match
//});
//data.arrExcepts.push({
//	mt:	"http://wonderwall.msn.com/movies/jennifer-lawrence-targeted-again-hacker-leaks-55-new-nude-photos-1841302.story",		//[string] match string, cannot be empty (always in lower case!)
//	tp: 0		//type of the match
//});
//data.arrExcepts.push({
//	mt:	"www.dennisbabkin.com",		//[string] match string, cannot be empty (always in lower case!)
//	tp: 2		//type of the match
//});


			
				//At this point we can use the settings!
				//+++++++++++++++++++++++++++++++++++++


				//Convert all exceptions to lower case
				var xcpts = data.arrExcepts;
				if(xcpts)
				{
					//Make sure we're not over the max limit
					if(xcpts.length > gl.gnMaxExcepts)
					{
						//Remove extra entries
						xcpts.splice(0, xcpts.length - gl.gnMaxExcepts);
					}

					//	'mt'		= [string] match string, cannot be empty (always in lower case!)
					//	'rx'		= 'true' if 'mt' contains Regular Expressions, otherwise - if it's just a match string
					//	'tp'		= type of the match, one of:
					//				   INFO: We'll assume page URL is: http://www.dennisbabkin.com:80/php/screencasts.php?what=sotts#printing
					//				   INFO: We'll assume page URL is: http://www.slides.example.com:80/php/page.php?what=doc#print
					//					0	= full case-insensitive match of the entire URL
					//					1	= case-insensitive match of host name only (excluding www & port number), or: "slides.example.com"
					//					2	= case-insensitive match of host name only (excluding port number), or: "www.slides.example.com"
					//					3	= case-insensitive match of host name (excluding www & port number) + page only, or: "slides.example.com/php/page.php"
					//					4	= case-insensitive match of host name (excluding port number) + page only, or: "www.slides.example.com/php/page.php"
					for(var i = 0; i < xcpts.length; i++)
					{
						xcpts[i].mt = xcpts[i].mt.toString().toLowerCase();
					}
				}


				//Set this app's version
				data.appVersion = gl.getThisAppVersion();

				//Assume success
				res = data;
			}
			else
			{
				//Error
				console.warn("[193] SttgsObj_ParseErr");
				return null;
			}
		}
		catch(e)
		{
			//Error
			console.warn("[191] SttgsObj_ParseErr: " + e.message);
			res = null;
		}

		return res;
	},
	
	
	setSettingsObject: function(objStgs, bUpdatePopups)
	{
		//Sets the entire settings object
		//IMPORTANT: It assumes that 'objStgs' is validated and correct!
		//'bUpdatePopups' = true to update by closing all popup windows

		//Set it
		gl.gSettings = objStgs;

		if(bUpdatePopups === true)
		{
			//Close all popup windows
			gl.closeAllPopupWindows(true);
		}
	},

	setStorageObject: function(objData, bUpdateNow)
	{
		//Replace existing storage object in 'gl.oStorage' with 'objData'
		//'bUpdateNow' = true to update persistent storage and close all popup windows

		//Assign it to the global storage object
		gl.oStorage = objData;

		//Reset "modified" flag
		gl.gbMod_oStorage = false;

		if(bUpdateNow === true)
		{
			//Need to save the data
			gl.onPersistentSaveStorage(true);		//Save always!

			//Close all popup windows
			gl.closeAllPopupWindows(true);
		}
	},

	changePersistentStorageType: function(nNewStgType, callbackDone)
	{
		//Change persistent storage type to 'nNewStgType'
		//'nNewStgType' = one of:
		//	0 = not to store in persistent storage (use browser's memory only)
		//	1 = localStorage
		//	2 = chrome.storage.local
		//'callbackDone' = if specified, is called when done processing this function. It is called as such: callbackDone(res) where, res is one of:
		//						= 'true' if saved OK
		//						= Error description string, if failed to save

		//Only if correct value
		if(nNewStgType >= 0 &&
			nNewStgType <= 2)
		{
			(function()		//Go into closure to preserve the input params
			{
				//Close all popup windows
				gl.closeAllPopupWindows(true);

				//Remove persistent storage for the old type first
				gl.clearAllPersistentStorage(gl.gSettings.nPersistStorageType, function(res)
				{
					//Only if success
					if(res === true)
					{
						//Set new storage type
						gl.gSettings.nPersistStorageType = nNewStgType;

						//Save settings in persistent storage
						gl.onPersistentSaveSettings(function(res2)
						{
							//See if failed to save settings
							if(res2 !== true)
							{
								//Error
								console.error("[239] Error saving settings: " + res2);
							}

							//Need to save the data
							gl.onPersistentSaveStorage(true, callbackDone);		//Save always!
						});
					}
					else
					{
						//Failed
						if(callbackDone)
							callbackDone("[236] Change failed: " + res);
					}
				});
			}());
		}
		else
		{
			//Error
			console.error("[231] Bad stg type=" + nNewStgType);

			if(callbackDone)
				callbackDone("[232] Bad type=" + nNewStgType);
		}

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

		//See what type of storage to use
		if(nStgType != 0 &&
			nStgType != 1 &&
			nStgType != 2)
		{
			//Read it from settings
			nStgType = gl.gSettings.nPersistStorageType;
		}

		if(nStgType == 0)
		{
			//Nothing to clear
			if(callbackDone)
				callbackDone(true);
		}
		else if(nStgType == 1)
		{
			//HTML5 local storage
			localStorage.clear();

			//Done
			if(callbackDone)
				callbackDone(true);
		}
		else if(nStgType == 2)
		{
			//chrome.storage.local
			chrome.storage.local.clear(function()
			{
				//Called when done
				var res;
				if(chrome.runtime.lastError)
				{
					//Error
					res = "[234] Clear error: " + chrome.runtime.lastError.message;
					console.error(res);
				}
				else
				{
					//Success
					res = true;
				}

				if(callbackDone)
					callbackDone(res);
			});
		}
		else
		{
			//Bad type
			console.error("[233] Bad type=" + nStgType);
		}
	},



	checkAndInstantiateObjStorage: function(data, bJSON, bIgnoreVersion)
	{
		//Checks that 'data' is a valid storage object and return it if yes
		//'data' = data to be used
		//'bJSON' = true if 'data' is expected to be "stringified" as JSON, false if it's an object
		//'bIgnoreVersion' = true to ignore <ver> parameter in the data
		//RETURN:
		//		= object with data to use - if data was accepted
		//		= null if error in data
		var res = null;

		try
		{
			//INFO: Make sure to parse from JSON first if needed
			var objData = bJSON ? JSON.parse(data) : data;

			var toStr = Object.prototype.toString;

			//It must be an object & must have the version property
			if(objData !== null && 
				typeof objData === 'object' &&
				(bIgnoreVersion === true || this._checkAndInitProp_String(toStr, objData, '<ver>', false))			//[string] Added only during saving -- must be present
				)
			{
				//Do we need to check version?
				if(bIgnoreVersion !== true)
				{
					//Get version of the app that saved the data (we'll be able to use in later versions)
					var strVer = objData['<ver>'];

					//Remove "ver" prop that was added there during saving
					delete objData['<ver>'];
				}

				//Go through all pages
				for(var pageUrl in objData)
				{
					//Page URL cannot be empty
					if(!pageUrl)
					{
						//Error
						console.log("[143] StgObj_ParseErr");
						return false;
					}

					var objPage = objData[pageUrl];

					//It must be an object with all properties
					//				'tm'	[Integer] UTC time when page was last saved, expressed as an integer of milliseconds since midnight of January 1, 1970
					//				'flg'	[Integer] Bitwise set of flags:
					//									0x1 =	set if had to stop collecting textboxes at maximum number of 'nMaxTxBxNum'
					//				'ttl'	[String] Page title, can be ""
					//				'fav'	[String] Favorites icon for the page (absolute) URL, can be ""
					//				'frms'	Object with data for all iframes in this page. Its properties:
					if(objPage !== null && 
						typeof objPage === 'object' &&
						this._checkAndInitProp_Int(toStr, objPage, 'tm') &&
						this._checkAndInitProp_Int(toStr, objPage, 'flg') &&
						this._checkAndInitProp_String(toStr, objPage, 'ttl', true) &&
						this._checkAndInitProp_String(toStr, objPage, 'fav', true) &&
						objPage.hasOwnProperty('frms') && toStr.call(objPage.frms) === '[object Object]')
					{
						//Look through all iframes
						for(var frmUrl in objPage.frms)
						{
							//IFrame URL cannot be empty
							if(!frmUrl)
							{
								//Error
								console.log("[144] StgObj_ParseErr: pageUrl=" + pageUrl);
								return null;
							}

							var objFrm = objPage.frms[frmUrl];

							//It must be an object with all properties
							if(objFrm !== null && 
								typeof objFrm === 'object')
							{
								//Look through all textboxes
								for(var tbxId in objFrm)
								{
									//Textbox ID cannot be empty
									if(!tbxId)
									{
										//Error
										console.log("[145] StgObj_ParseErr: frmUrl=" + frmUrl + ", pageUrl=" + pageUrl);
										return null;
									}

									var objTxBx = objFrm[tbxId];

									//It must be an object with all properties
									//						                         'si'		 [integer] Sequential integer/index for this textbox -- trying to make it unique for all checkboxes on this page
									//												 'osi'		 [integer] Original sequential integer/index for this textbox, assigned by the element's order in content script
									//						                         'id'		 [string] html ID of the element (can be 'null' or "" if no such)
									//	                        					 'nm'		 [string] html Name of the element (can be 'null' or "" if no such)
									//				                        		 'tp'		 [string] html type of the element, always lower-case (cannot be 'null' or "") -- example: "textbox", "search", "textarea", etc.
									//					                        	 'tx'		 [Array] Object with textbox text and when it was saved (max size is defined by 'nMaxTxtValNum' variable):
									if(objTxBx !== null && 
										typeof objTxBx === 'object' &&
										this._checkAndInitProp_Int(toStr, objTxBx, 'si') &&
										this._checkAndInitProp_Int(toStr, objTxBx, 'osi') &&
										this._checkAndInitProp_String(toStr, objTxBx, 'id', true) &&
										this._checkAndInitProp_String(toStr, objTxBx, 'nm', true) &&
										this._checkAndInitProp_String(toStr, objTxBx, 'tp', false) &&							//Cannot be empty!
										objTxBx.hasOwnProperty('tx') && toStr.call(objTxBx.tx) === '[object Array]')
									{
										var arrTxs = objFrm[tbxId].tx;

										//Must be array with non-zero length
										if(arrTxs.length > 0)
										{
											//Then check all of its elements
											for(var t = 0; t < arrTxs.length; t++)
											{
												var objTxTm = arrTxs[t];

												//It must be an object with all properties
												//					                						  'tm'	[Integer] number of milliseconds between UTC time of saving 'v' and midnight of January 1, 1970
												//						                					  'v'	[string] text in the textbox (cannot be "" or 'null)
												if(objTxTm !== null && 
													typeof objTxTm === 'object' &&
													this._checkAndInitProp_Int(toStr, objTxTm, 'tm') &&
													this._checkAndInitProp_String(toStr, objTxTm, 'v', false))		//Cannot be empty!
												{
													//All good so far...
												}
												else
												{
													//Error
													console.log("[146] StgObj_ParseErr: t=" + t + ", tbxId=" + tbxId + ", frmUrl=" + frmUrl + ", pageUrl=" + pageUrl);
													return null;
												}
											}
										}
										else
										{
											//Error
											console.log("[147] StgObj_ParseErr: ln=" + arrTxs.length + ", tbxId=" + tbxId + ", frmUrl=" + frmUrl + ", pageUrl=" + pageUrl);
											return null;
										}
									}
									else
									{
										//Error
										console.log("[148] StgObj_ParseErr: tbxId=" + tbxId + ", frmUrl=" + frmUrl + ", pageUrl=" + pageUrl);
										return null;
									}
								}
							}
							else
							{
								//Error
								console.log("[149] StgObj_ParseErr: frmUrl=" + frmUrl + ", pageUrl=" + pageUrl);
								return null;
							}
						}
					}
					else
					{
						//Error
						console.log("[150] StgObj_ParseErr: pageUrl=" + pageUrl);
						return null;
					}
				}


				//Assume success
				res = objData;
			}
			else
			{
				//Error
				console.log("[192] StgObj_ParseErr");
				return null;
			}
		}
		catch(e)
		{
			//Error
			console.log("[142] StgObj_ParseErr: " + e.message);
			res = null;
		}

		return res;
	},


	_checkAndInitProp_String: function(toStr, obj, propName, bCanBeEmpty)
	{
		//Checks if 'obj' contains the property with the name 'propName' and is a string
		//'toStr' = must be initialized to Object.prototype.toString
		//'bCanBeEmpty' = true if property can be empty, or not set, false - if it must be present and not be empty!
		//					INFO: If set to true, may alter 'obj' by adding an empty 'propName' property
		//RETURN:
		//		= object with data to use - if data was accepted
		//		= null if error in data
		var res = null;

		if(obj.hasOwnProperty(propName))
		{
			//Make sure it's a correct type
			if(toStr.call(obj[propName]) !== '[object String]')
			{
				//Wrong type
				return false;
			}

			if(bCanBeEmpty)
			{
				//Prop exists, is the correct type, and may or may not be empty
				return true;
			}
			else
			{
				//Must not be empty
				return obj[propName] ? true : false;
			}
		}
		else
		{
			if(bCanBeEmpty)
			{
				//Prop doesn't exist, but it can be empty -- so set it to such
				obj[propName] = "";

				return true;
			}
		}

		return false;
	},

	_checkAndInitProp_Int: function(toStr, obj, propName)
	{
		//Checks if 'obj' contains the property with the name 'propName' and is an Integer
		//'toStr' = must be initialized to Object.prototype.toString
		//RETURN:
		//		= true if passed
		if(obj.hasOwnProperty(propName))
		{
			//Make sure it's a correct type
			if(toStr.call(obj[propName]) !== '[object Number]')
			{
				//Wrong type
				return false;
			}

			//Must be an int
			return this.isInt(obj[propName]) ? true : false;
		}

		return false;
	},

	_checkAndInitProp_Bool: function(toStr, obj, propName)
	{
		//Checks if 'obj' contains the property with the name 'propName' and is an boolean
		//'toStr' = must be initialized to Object.prototype.toString
		//RETURN:
		//		= true if passed
		if(obj.hasOwnProperty(propName))
		{
			//Make sure it's a correct type
			if(toStr.call(obj[propName]) !== '[object Boolean]')
			{
				//Wrong type
				return false;
			}

			//Must be a boolean
			return obj[propName] === true || obj[propName] === false;
		}

		return false;
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
		return !isNaN(v) && 
			parseInt(Number(v)) == v && 
			!isNaN(parseInt(v, 10));
	},


	isRegExpValid: function(regExp)
	{
		//Checks if 'regExp' is a valied regexp that can be used in RegExp.test() method
		//RETURN:
		//		= true if yes, it is valid
		//		= false if not, it is not valid
		var res = true;

		try
		{
			//Try it
			new RegExp(regExp);
		}
		catch(e)
		{
			//Error
			res = false;
		}

		return res;
	},



	onPersistentSaveSettings: function(callbackDone)
	{
		//Save 'gl.gSettings' object in persistent storage
		//INFO: Uses sync storage of the browser
		//'callbackDone' = if specified, method to call when finished. It is called as such: callbackDone(res), where res can be:
		//						= true - if saved successfully
		//						= String - if not saved, has error message

		try
		{
			//Use Chrome's chrome.storage.sync
			var objSave = {};
			objSave[gl.gstrPersistSettingsKeyName] = gl.gSettings;

			chrome.storage.sync.set(objSave, function() 
			{
				var res = null;
				
				//We get here at the end
				if(chrome.runtime.lastError)
				{
					//Error saving
					res = chrome.runtime.lastError.message;
					res = res ? res.toString() : "";
					console.error("[185] Error saving settings: " + res);
				}
				else
				{
					//All done
					res = true;
				}
				
				//Notify callback
				if(callbackDone)
					callbackDone(res);
			});
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(186, e);

			if(callbackDone)
				callbackDone("[187] Exception: " + e.message);
		}
	},


	onPersistentLoadSettings: function(callbackDone)
	{
		//Load settings object in 'gl.gSettings' from the persistent storage
		//'callbackDone' = if specified, method to call when finished. It is called as such: callbackDone(res), where res can be:
		//						= true - if loaded successfully
		//						= String - if not loaded, has error message
		try
		{
			//Use chrome.storage.sync
			chrome.storage.sync.get(gl.gstrPersistSettingsKeyName, function(items)
			{
				var res = null;
				
				if(chrome.runtime.lastError)
				{
					//Error loading
					res = chrome.runtime.lastError.message;
					res = res ? res.toString() : "";
					console.error("[190] Error loading settings: " + res);
				}
				else
				{
					//All loaded OK
					var data = items[gl.gstrPersistSettingsKeyName];
					
					//Got data?
					if(data)
					{
						//Check that data is valid & save it
						//		= object with data to use - if data was accepted
						//		= null if error in data
						var resDta = gl.checkAndInstantiateObjSettings(data);
						if(resDta)
						{
							//Assign it to the global settings object
							gl.gSettings = resDta;

							//All good
							res = true;
						}
						else
						{
							//Failed to parse
							res = "[196] Parse error";
						}
					}
					else
					{
						//No data, use defaults
						gl.gSettings = $.extend(true, {}, gl.gSettings_Default);
						
						res = true;
					}
				}

				//Notify callback
				if(callbackDone)
					callbackDone(res);
			});
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(188, e);

			if(callbackDone)
				callbackDone("[189] Exception: " + e.message);
		}
	},


	onAfterPersistentSettingsChange: function(objOld, objNew)
	{
		//Is called after the 'gl.gSettings' object was changed from either Settings window, or from the outside (for instance, after the Chrome "sync" process)
		//'objOld' = old values of the 'gl.gSettings' object
		//'objNew' = new values of the 'gl.gSettings' object
		try
		{
			//Make sure objects are defined
			if(!objOld)
				objOld = {};
			if(!objNew)
				objNew = {};

			//See if there's a change that will require all popup windows to be closed
			if(objOld.bIncogCollectData !== objNew.bIncogCollectData ||
				objOld.nViewIncogData !== objNew.nViewIncogData ||
				objOld.bUseNativeScrollbars !== objNew.bUseNativeScrollbars)
			{
				//Close all popup windows
				gl.closeAllPopupWindows();
			}

			//See if we need to update all badge icons/text/etc
			if(objOld.bIncogCollectData !== objNew.bIncogCollectData /*||
				!gl.isSame_arrExcepts(objOld.arrExcepts, objNew.arrExcepts)*/)
			{
				//And update icons for all open tabs
				gl.updateIconAndBadge_AllTabs();

			}

			//See if we need to resave the persistent storage
			if(objOld.bIncogSavePersistStorage !== objNew.bIncogSavePersistStorage)
			{
				//Need to save the data
				//INFO: It will ensure that the data collected for Incognito tabs will either saved or discarded
				gl.onPersistentSaveStorage(true);		//Save always!
			}

		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(207, e);
		}
	},
	
	

	onPersistentLoadStorage: function(callbackDone)
	{
		//Load storage object in 'gl.oStorage' from the persistent storage
		//INFO: Must be called only when the app initializes!
		//'callbackDone' = if specified, method to call when finished. It is called as such: callbackDone(res), where res can be:
		//						= true - if read successfully
		//						= false or null - if error, 'gl.oStorage' storage object was not changed
		//						= String - if not loaded, but has a message
		var res = false;

		try
		{
			//Pick type of storage
			//	0 = not to store in persistent storage (use browser's memory only)
			//	1 = localStorage
			//	2 = chrome.storage.local
			var stgType = gl.gSettings.nPersistStorageType;

			switch(stgType)
			{
				case 0:
				{
					//No storage
					res = "Not used";
				}
				break;

				case 1:
				{
					//Use local storage
					var strData = localStorage.getItem(gl.gstrPersistStorageKeyName);

					if(strData)
					{
						//Check data for correctness & apply if it passes (it is presented as JSON string)
						//		= object with data to use - if data was accepted
						//		= null if error in data
						var objRes = gl.checkAndInstantiateObjStorage(strData, true);
						if(objRes)
						{
							//Done, set it
							gl.setStorageObject(objRes, false);
							res = true;
						}
						else
						{
							//Data parse failed
							console.error("[138] Failed to parse persistent storage data. Contents will be discarded. Contact developers at " + gl.gstrDevContact);
						}
					}
					else
					{
						//No data exists
						res = "No data";
					}
				}
				break;

				case 2:
				{
					//Use chrome.storage.local
					chrome.storage.local.get(gl.gstrPersistStorageKeyName, function(items)
					{
						//Check result
						var res2 = false;
						if(chrome.runtime.lastError)
						{
							//Error reading
							console.log("[140] Failed to read persistent storage: " + chrome.runtime.lastError.message);
						}
						else
						{
							//Got data?
							if(items[gl.gstrPersistStorageKeyName])
							{
								//Check data for correctness & apply if it passes
								//		= object with data to use - if data was accepted
								//		= null if error in data
								var objRes2 = gl.checkAndInstantiateObjStorage(items[gl.gstrPersistStorageKeyName], false);
								if(objRes2)
								{
									//Done, set it
									gl.setStorageObject(objRes2, false);
									res2 = true;
								}
								else
								{
									//Data parse failed
									console.error("[139] Failed to parse persistent storage data. Contents will be discarded. Contact developers at " + gl.gstrDevContact);
								}
							}
							else
							{
								//No data exists
								res2 = "No data";
							}
						}

						//Notify callback
						if(callbackDone)
							callbackDone(res2);

						return;
					});

					//Called async!
					return;
				}
				break;
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(136, e);
			res = null;
		}

		//Notify callback
		if(callbackDone)
			callbackDone(res);
	},


	getDeepCopyStorage: function(bIncludeIncog)
	{
		//Make a deep-copy of the 'gl.oStorage' object
		//'bIncludeIncog' = true to include data saved from Incognito tabs
		//RETURN:
		//		= resulting copy of the storage object

		if(bIncludeIncog)
		{
			//Include all
			return $.extend(true, {}, gl.oStorage);
		}

		//Look through all props
		var resObj = {};
		for(var pageUrl in gl.oStorage)
		{
			var objPage = gl.oStorage[pageUrl];

			//Only if not incognito
			if(!(objPage.flg & 0x2))		//0x2 =	set if page data came from "Incognito" tab
			{
				//Add it as a "deep copy"
				resObj[pageUrl] = $.extend(true, {}, objPage);
			}
		}

		return resObj;
	},


	onPersistentSaveStorage: function(bSaveAlways, callbackDone)
	{
		//Must be called to save the current collected storage
		//INFO: The source of persistent storage is set by the user in Settings
		//'bSaveAlways' = false to save only if data was changed, or true to save in any case
		//'callbackDone' = if specified, is called when done processing this function. It is called as such: callbackDone(res) where, res is one of:
		//						= 'true' if saved OK
		//						= Error description string, if failed to save

		//See what type of storage to use
		//	0 = not to store in persistent storage (use browser's memory only)
		//	1 = localStorage
		//	2 = chrome.storage.local
		var stgType = gl.gSettings.nPersistStorageType;

		if(stgType != 0)
		{
			//Do we need to check "modified" flag?
			if(bSaveAlways ||
				gl.gbMod_oStorage)		//Save only if data was "modified"
			{
				//Make a "deep" copy of the storage object
				//INFO: We need this because we may prune this object while saving if it's too big
				var objStorageCpy = gl.getDeepCopyStorage(gl.gSettings.bIncogSavePersistStorage);

				//Add this app's version
				//INFO: It is needed to upgrade for any future versions
				objStorageCpy['<ver>'] = gl.getThisAppVersion();

				//And begin saving (with iteration 0)
				gl._persistSaveIteration(objStorageCpy, gl.gstrPersistStorageKeyName, stgType, gl._savePersistStrgCallback, callbackDone, 0);
			}
		}
		else
		{
			//No saving is needed
			if(callbackDone)
				callbackDone(true);
		}
	},

	_savePersistStrgCallback: function(res, callbackDone)
	{
		//Method that is called at the end of processing onPersistentSaveStorage()
		//'res' = result of the operation:
		//					= 'true' if saved OK
		//					= Error description string, if failed to save
		if(res === true)
		{
			//Data was successfully saved in persistent storage
			gl.gbMod_oStorage = false;		//Reset "modified" flag

			console.log(gl.getCurrentTimeUTC() + ": Saved data in persistent storage, type=" + gl.gSettings.nPersistStorageType);
		}
		else
		{
			//Error saving
			console.error("[135] FAILED to save data in persistent storage for type=" + gl.gSettings.nPersistStorageType + ": " + res);
		}

		//Do we need to call a callback method?
		if(callbackDone)
			callbackDone(res);
	},


	_persistSaveIteration: function(objData, name, stgType, callbackRes, objClbk, itr)
	{
		//Attempts to save 'objData' in persistent storage
		//'objData' = copy of the storage object in 'gl.oStorage' (Make sure to make a "deep" copy of the original, because IT MAY BE PRUNED if it doesn't fit into persistent storage!)
		//'name' = name of the storage variable to use as a key
		//'stgType' = type of persistent storage to use (one of):
		//				1 = localStorage
		//				2 = chrome.storage.local
		//'callbackRes' = if provided, will be called with the result as such callbackRes(res, objClbk), where 'res' could be:
		//					= 'true' if saved OK
		//					= Error description string, if failed to save
		//'objClbk' = will be passed as a parameter for the 'callbackRes' function
		//'itr' = [integer] 0 and up, current iteration
		var errDesc = null;

		//Try to save it as-is
		try
		{
			//Make sure we're not iterating too much
			if(itr < 1000)
			{
				switch(stgType)
				{
					case 1:
					{
						//Use HTML5 local storage
						//INFO: Make sure to convert into JSON format
						localStorage.setItem(name, JSON.stringify(objData));

						//If we get here -- then it's a success
						if(callbackRes)
							callbackRes(true, objClbk);

						return;
					}
					break;

					case 2:
					{
						//Use Chrome's chrome.storage.local
						var objSave = {};
						objSave[name] = objData;

						chrome.storage.local.set(objSave, function() 
						{
							//We get here at the end
							if(chrome.runtime.lastError)
							{
								//Error occurred
								var errMsg = chrome.runtime.lastError ? chrome.runtime.lastError.message : "";
								errMsg = errMsg ? errMsg.toString() : "";

								//Check for exceeded quota
								if(/QUOTA_BYTES/gi.test(errMsg))
								{
									//Quota was exceeded, need to try again
									console.log("[126] PersistStorageSaving: Exceeded quota, iteration: " + itr);

									//Try again, we're not done yet
									gl._persistShrinkIteration(objData, name, stgType, callbackRes, objClbk, itr);
									return;
								}
								else
								{
									//Some other error

									//Notify callback
									if(callbackRes)
										callbackRes(errMsg, objClbk);
								}
							}
							else
							{
								//Saved OK!
								if(callbackRes)
									callbackRes(true, objClbk);
							}

							return;
						});

						return;
					}
					break;

					default:
					{
						//Unsupported type
						errDesc = "[125] PersistStorageSaving ERR: Bad type=" + stgType;
					}
					break;
				}
			}
			else
			{
				//Too many iterations
				errDesc = "[128] PersistStorageSaving ERR: Too many iterations, " + itr;
			}
		}
		catch(e)
		{
			//Failed to save, let's see why
			if(e.name == 'QuotaExceededError')
			{
				//Quota was exceeded, need to try again
				console.log("[127] PersistStorageSaving: Exceeded quota, iteration: " + itr);
				
				//Try again, we're not done yet
				gl._persistShrinkIteration(objData, name, stgType, callbackRes, objClbk, itr);
				return;
			}
			else
			{
				//Some other error
				errDesc = "[124] PersistStorageSaving ERR: " + e.message;
			}
		}

		//We get here in case of an error
		if(callbackRes)
			callbackRes(errDesc, objClbk);
	},



	_persistShrinkIteration: function(objData, name, stgType, callbackRes, objClbk, itr)
	{
		//Shrink data in 'objData' and attempt saving again
		var errDesc = null;

		try
		{
			var bDelSomething = false;	//Set when something was removed from the storage object

			//Begin by removing older saved values on all textboxes
			//INFO: Do it one-by-one
			for(var pageUrl in objData)
			{
				var obgPage = objData[pageUrl];

				//Look through all iframes
				for(var frmUrl in obgPage.frms)
				{
					var objFrm = obgPage.frms[frmUrl];

					//Look through all textboxes
					for(var tbxId in objFrm)
					{
						var arrTxs = objFrm[tbxId].tx;

						//Don't do anything if there's only one element
						if(arrTxs.length > 1)
						{
							//Pick the earlest item
							var nDelInd = 0;
							var nTmMin = arrTxs[nDelInd].tm;
							for(var i = 1; i < arrTxs.length; i++)
							{
								if(arrTxs[i].tm < nTmMin)
								{
									nTmMin = arrTxs[i].tm;
									nDelInd = i;
								}
							}

							//And remove that element from the array
							arrTxs.splice(nDelInd, 1);

							//Set flag
							bDelSomething = true;
						}
					}
				}
			}


			//Did we remove at least something?
			if(!bDelSomething)
			{
				//If no, then begin removing older pages
				//INFO: Do it one-by-one

				//Only if we have more than 1 page
				if(Object.keys(objData).length > 1)
				{
					//First find the earliest page
					var nTmMin = 9007199254740992;			//Use largest int. More info: http://stackoverflow.com/q/307179/843732
					var nDelPgUrl = null;
					for(var pageUrl in objData)
					{
						var obgPage = objData[pageUrl];

						if(nDelPgUrl === null ||
							obgPage.tm < nTmMin)
						{
							nTmMin = obgPage.tm;
							nDelPgUrl = pageUrl;
						}
					}

					//Delete page data
					delete objData[nDelPgUrl];

					//Set flag
					bDelSomething = true;
				}

			}


			//In the end, did we discard anything
			if(bDelSomething)
			{
				//Call the following function async'ly
				window.setTimeout(function()
				{
					//Try saving again (by increasing the iteration number)
					gl._persistSaveIteration(objData, name, stgType, callbackRes, objClbk, itr + 1);
				},
				0);

				return;
			}
			else
			{
				//Quit, we have no choice!
				errDesc = "[134] PersistStorageSaving ERR: Cannot remove more data";
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(129, e);
			errDesc = "[131] PersistStorageSaving ERR: " + e.message;
		}

		//We failed, notify callback
		if(callbackRes)
			callbackRes(errDesc, objClbk);
	},



	callAsync2: function(fn, p1, p2)
	{
		//Call 'fn' function asynchronously
		//'fn' = function to call. Defers invoking the function until the current call stack has cleared
		//			INFO: The function is called as such: fn(p1, p1);
		//RETURN:
		//		= Immediately without calling 'fn'

		//More details:	http://stackoverflow.com/q/9516900/843732
		if(fn)
		{
			window.setTimeout(function()
			{
				fn(p1, p2);
			}, 
			0);
		}
	},


	checkTabIDValid: function(nTabID, callbackDone)
	{
		//Async checks if 'nTabID' refers to existing tab
		//'callbackDone' = callback function that is called with the result as such: callbackDone(res), where 'res' is one of:
		//						= true if yes, tab exists
		//						= false if no
		chrome.browserAction.getBadgeText({tabId: nTabID}, function(dummy)
		{
			var lstErr = chrome.runtime.lastError;
			
			if(callbackDone)
				callbackDone(!lstErr);
		});
	},



	onInstallUpdate: function()
	{
		//Called to restart this app when new update is available

		//First save data in persistent storage
		gl.onPersistentSaveStorage(true,		//Save "always" to be sure!
			function(res)
			{
				//Called after everything is saved, or in case of an error

				//Reload the app
				chrome.runtime.reload();
			});
	},


	onFirstInstall: function()
	{
		//Called right after the app was installed for the first time

		//Show the info window
		gl.openAppInfoWindow();
	},


	getSettingsForContent: function()
	{
		//Collect settings data that can be sent to the content.js
		//RETURN:
		//		= Object with settings

		return {
			nCollectFlgs: gl.gSettings.nCollectFlgs,			//Bitwise integer specifying which textboxes to collect
			nCollectMax: gl.gSettings.nMaxTxBxNum,				//[1 and up) Maximum number of textboxes to collect
			bCollectData: gl.gSettings.bCollectData,			//true to allow data collection from visted web pages (overrides 'bIncogCollectData')
			bIncogCollectData: gl.gSettings.bIncogCollectData	//true to allow data collection from visted web pages opened in the "Incognito" tabs (can be overridden by 'bCollectData')
			};
	},

	getMaxPersistStorageSize: function(nStgType)
	{
		//'nStgType' storage type to look up:
		//	1 = localStorage
		//	2 = chrome.storage.local
		//RETURN:
		//		= [Integer] for the maximum size of the persistent storage in bytes
		//		= 0 if error or unknown
		var nMaxSz = 0;

		if(nStgType == 1)
		{
			//Using HTML5 localStorage

			//We'll assume it's plain 5MB in chars (there's no way of finding this out from Chrome)
			//INFO: This value was obtained experimentally in 'Formalizr\workfiles\test1.html' script (use 'Test Max Storage Sz' button)
			nMaxSz = 5242880;
		}
		else if(nStgType == 2)
		{
			//Using chrome.storage.local
			nMaxSz = chrome.storage.local.QUOTA_BYTES;
			nMaxSz = gl.isInt(nMaxSz) ? nMaxSz : 0;
		}

		return nMaxSz;
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

		if(nStgType == 1)
		{
			//Using HTML5 localStorage
			var nSz = 0;

			for(var k in localStorage)
			{
				//'localStorage' stores data as text in Unicode-16 format, or with 2 bytes per character -- WRONG!
				//INFO: This was confirmed experimentally in 'Formalizr\workfiles\test1.html' script (use 'Test Max Storage Sz' button)
				nSz += localStorage[k].length;
			}

			//Invoke callback
			if(callbackRes)
				callbackRes(nSz);
		}
		else if(nStgType == 2)
		{
			//Using chrome.storage.local
			chrome.storage.local.getBytesInUse(null, function(bytesInUse)
			{
				//Callback with result
				var nSz = -1;

				//Did we get something
				if(chrome.runtime.lastError)
				{
					//Error
					console.error("[153] ERR: " + chrome.runtime.lastError.message);
				}
				else
				{
					//Got something
					nSz = bytesInUse;
				}

				//Invoke callback
				if(callbackRes)
					callbackRes(nSz);
			});
		}

	},


	getLastVisitedURL: function()
	{
		//RETURN:
		//		= Last visited URL, or
		//		= "" if none or not known
		return gl.gstrLastVisitedTabURL;
	},

	
	popupWindowShown: function(bShown)
	{
		//Called when pop-up window is shown or hidden
		try
		{
			//console.log("Popup=" + bShown);
		
			////Highlight form controls or remove highlighting
			//chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
			//{
			//	//Send message to do the work
			//	chrome.tabs.sendMessage(tabs[0].id, {action: "hilite", on: bShown});
			//});
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(104, e);
		}
	},
	
	
    encodeHtml: function(txt)
    {
        //Encode 'txt' to be placed into HTML attribute
        //RETURN:
        //      = Encoded string
		if(!txt)
			return "";

        // http://stackoverflow.com/questions/18749591/encode-html-entities-in-javascript

        return txt.replace(/\"|\&|\n|\r|[\u00A0-\u9999<>\&]/gim, function(o) {
            return '&#' + o.charCodeAt(0) + ';';
        });
    },


	getUrlPathOnly: function(url)
	{
		//RETURN:
		//		= URL path only
		if(!url)
			return "";

		var a = document.createElement("a");
		a.href = url;
		
		//For URL: 
		//		http://example.com:3000/pathname/?search=test#hash
		//		http://www.dennisbabkin.com:80/php/screencasts.php?what=sotts#printing
		//
		//	parser.protocol; // => "http:"
		//	parser.host;     // => "example.com:3000"
		//	parser.hostname; // => "example.com"
		//	parser.port;     // => "3000"
		//	parser.pathname; // => "/pathname/"
		//	parser.hash;     // => "#hash"
		//	parser.search;   // => "?search=test"	
		var resUrl = a.protocol + "//" + a.host + a.pathname;
	
		// Handle chrome which will default to domain where script is called from if invalid
		return url.indexOf(a.hostname) != -1 ? resUrl : "";
	},

	getUrlParams: function(url)
	{
		//Given a URL returns array with its "tail" parameters
		//Example: for "http://example.com:3000/pathname/?s=test&v=3" will return an object with props:
		//	{s: "test"},
		//	{v: "3"}
		var objRes = {};

		if(url)
		{
			var a = document.createElement("a");
			a.href = url;

			var qs = a.search.replace(/^\?/, '').split('&');
			if(qs)
			{
				var pars;
				for(var i = 0; i < qs.length; i++)
				{
					pars = qs[i].split('=');
					if(pars.length == 2)
					{
						objRes[decodeURIComponent(pars[0])] = decodeURIComponent(pars[1]);
					}
					else if(pars.length == 1 && pars[0])
					{
						objRes[decodeURIComponent(pars[0])] = "";
					}
				}
			}
		}

		return objRes;
	},
	
	
	getCurrentTimeUTC: function()
	{
		//RETURN:
		//		= number of milliseconds between current UTC time and midnight of January 1, 1970
		var tmLoc = new Date();
		//The offset is in minutes -- convert it to ms
		return tmLoc.getTime() + tmLoc.getTimezoneOffset() * 60000;
	},
	

	getThisAppVersion: function()
	{
		//RETURN:
		//		= This app's version as a string (Example: "1.0.0.0", or "1.0.0.0 beta")

		//Use the singleton to make it faster
		if(gl.__gstr_ver === null)
		{
			try
			{
				//Read it from the manifest
				var manifest = chrome.runtime.getManifest();
				strVer = manifest.version;

				//Set singleton
				gl.__gstr_ver = strVer ? strVer.toString() : "";
			}
			catch(e)
			{
				//Exception
				gl.logExceptionReport(137, e);
				gl.__gstr_ver = "";
			}
		}

		return gl.__gstr_ver;
	},
	__gstr_ver: null,					//DO NOT USE directly


	replaceNewLines: function(str)
	{
		//Substitute new-lines in 'str' with OS specific ones, according to user selection

		if(!str)
			str  = "";

		//See if we need to do any newline substitutions
		//	0 =		No conversion
		//	1 =		Use Windows newlines: \r\n
		//	2 =		Use OS X/Linux/Unix newlines: \n
		//	3 =		Use Apple II/OS-9 style newlines: \r
		var nSubst = gl.gSettings.nCopySubstNewLines;

		if(nSubst == 1)
		{
			//Use windows newlines
			str = str.replace(/\r\n|\n\r|\n|\r/g, "\r\n");
		}
		else if(nSubst == 2)
		{
			//Use Unix newlines
			str = str.replace(/\r\n|\n\r|\n|\r/g, "\n");
		}
		else if(nSubst == 3)
		{
			//Use Apple II newlines
			str = str.replace(/\r\n|\n\r|\n|\r/g, "\r");
		}

		return str;
	},


	isPositiveInteger: function (x)
	{
		// http://stackoverflow.com/a/1019526/11236
		return /^\d+$/.test(x);
	},

	normalizeVersion: function(v)
	{
		//Remove anything except digits and periods from 'v'
		//RETURN:
		//		= Resulting version
		if(!v)
			return "";

		return v.replace(/[^\d\.]/g, "");
	},

	compareVersions: function(v1, v2)
	{
		//RETURN:
		//		= 0 if both are the same
		//		= 1 if v1 > v2
		//		= -1 if v1 < v2
		//		= NaN if error

		if(v1 === null || v1 === undefined ||
			v2 === null || v2 === undefined)
			return NaN;

		var v1parts = gl.normalizeVersion(v1).trim().split('.');
		var v2parts = gl.normalizeVersion(v2).trim().split('.');

		// First, validate both numbers are true version numbers
		function validateParts(parts) {
			for (var i = 0; i < parts.length; ++i) {
				if (!gl.isPositiveInteger(parts[i])) {
					return false;
				}
			}
			return true;
		}

		if (!validateParts(v1parts) || !validateParts(v2parts)) {
			return NaN;
		}

		for (var i = 0; i < v1parts.length; ++i) {
			if (v2parts.length === i) {
				return 1;
			}

			if (v1parts[i] === v2parts[i]) {
				continue;
			}
			if (v1parts[i] > v2parts[i]) {
				return 1;
			}
			return -1;
		}

		if (v1parts.length != v2parts.length) {
			return -1;
		}

		return 0;
	},


	//isSame_arrExcepts: function(a1, a2)
	//{
	//	//'a1' and 'a2' = must point to exception arrays, like 'gl.gSettings.arrExcepts'
	//	//RETURN: = true if two exception arrays are the same
	//	if(a1 &&
	//		a2 &&
	//		a1.length !== undefined &&
	//		a2.length !== undefined &&
	//		a1.length == a2.length)
	//	{
	//		for(var i = a1.length - 1; i >= 0; i--)
	//		{
	//			//	'mt'		= [string] match string, cannot be empty (always in lower case!)
	//			//	'tp'		= type of the match, one of:
	//			if(a1[i].mt !== a2[i].mt)
	//				return false;

	//			if(a1[i].tp !== a2[i].tp)
	//				return false;
	//		}
		
	//		return true;
	//	}
	
	//	return false;
	//},


	toggleException: function(url, nSetType, bUpdateBadgeIcon)
	{
		//Toggle exception for 'url'
		//'nSetType' = type of exception (used for setting only):
		//				0	= add site exception
		//				1	= add page exception
		//'bUpdateBadgeIcon' = set to 'true' to update active badge icon
		var bChng = false;

		//First try to locate it
		//		= [0 and up) - index in 'gSettings.arrExcepts' array for the triggered exception, if URL did not pass -- DO NOT collect data
		//		= null - if URL passes and can be used to collect data
		var nInd = gl.checkUrlExceptions(url);
		if(nInd === null)
		{
			//We need to ADD

			//Make sure we're not over the limit
			if(gl.gSettings.arrExcepts.length < gl.gnMaxExcepts)
			{
				var strMtch = null;

				//Add exception
				if(nSetType == 1)
				{
					//Add page
					var m = url.match(/^(?:http|https)\:\/\/(?:www\.)?([^\/:]+)(?:[^:]*:\d+)?([^?#]+)/i);			//If regexp is changed here, change it in checkUrlExceptions() as well
					if(m && m.length > 2)
					{
						//Concatenate two results, bypassing port number if there
						strMtch = m[1].toString() + m[2].toString();
					}

					if(strMtch)
					{
						//Add it as site exception
						//	'mt'		= [string] match string, cannot be empty (always in lower case!)
						//	'rx'		= 'true' if 'mt' contains Regular Expressions, otherwise - if it's just a match string
						//	'tp'		= type of the match, one of:
						//					0	= full case-insensitive match of the entire URL
						//					1	= case-insensitive match of host name only (excluding www & port number), or: "slides.example.com"
						//					2	= case-insensitive match of host name only (excluding port number), or: "www.slides.example.com"
						//					3	= case-insensitive match of host name (excluding www & port number) + page only, or: "slides.example.com/php/page.php"
						//					4	= case-insensitive match of host name (excluding port number) + page only, or: "www.slides.example.com/php/page.php"
						gl.gSettings.arrExcepts.push({
							mt: strMtch.toString().toLowerCase(),
							rx: false,			//Always no RegExp
							tp: 3
						});

						bChng = true;
					}
					else
					{
						//Can't add it
						console.warn("[262] Can't add page exception for the URL: " + url);
					}
				}
				else
				{
					//Add site
					var m = url.match(/^(?:http|https)\:\/\/(?:www\.)?([^\/?#:]+)/i);					//If regexp is changed here, change it in checkUrlExceptions() as well
					if(m && m.length > 1)
					{
						strMtch = m[1];
					}

					if(strMtch)
					{
						//Add it as site exception
						//	'mt'		= [string] match string, cannot be empty (always in lower case!)
						//	'rx'		= 'true' if 'mt' contains Regular Expressions, otherwise - if it's just a match string
						//	'tp'		= type of the match, one of:
						//					0	= full case-insensitive match of the entire URL
						//					1	= case-insensitive match of host name only (excluding www & port number), or: "slides.example.com"
						//					2	= case-insensitive match of host name only (excluding port number), or: "www.slides.example.com"
						//					3	= case-insensitive match of host name (excluding www & port number) + page only, or: "slides.example.com/php/page.php"
						//					4	= case-insensitive match of host name (excluding port number) + page only, or: "www.slides.example.com/php/page.php"
						gl.gSettings.arrExcepts.push({
							mt: strMtch.toString().toLowerCase(),
							rx: false,			//Always no RegExp
							tp: 1
						});

						bChng = true;
					}
					else
					{
						//Can't add it
						console.warn("[261] Can't add host name exception for the URL: " + url);
					}
				}
			}
			else
			{
				//Can't add one more exception
				console.warn("[260] Too many exceptions (" + gl.gSettings.arrExcepts.length + "), can't add another one: " + url);
			}
		}
		else
		{
			//We need to REMOVE

			//Remove exception
			gl.gSettings.arrExcepts.splice(nInd, 1);

			//See if there's more similar exceptions to remove
			for(var t = gl.gSettings.arrExcepts.length - 1; t >= 0; t--)
			{
				//		= [0 and up) - index in 'gSettings.arrExcepts' array for the triggered exception, if URL did not pass -- DO NOT collect data
				//		= null - if URL passes and can be used to collect data
				nInd = gl.checkUrlExceptions(url);
				if(nInd === null)
					break;

				//Remove it too
				gl.gSettings.arrExcepts.splice(nInd, 1);
			}

			bChng = true;
		}


		//Any changes?
		if(bChng)
		{
			//Save value in Settings in persistent storage
			gl.onPersistentSaveSettings(function(res)
			{
				if(res !== true)
				{
					//Failed saving settings
					console.error("[263] Failed to save settings: " + res);
				}
			});
		}

		//Do we need to update all tabs?
		if(bUpdateBadgeIcon === true)
		{
			gl.updateInfoFromActiveTab();
		}
	},


	determinePlatform: function(callbackDone)
	{
		//Asynchronously sets the platform this app runs on
		//'callbackDone' = if specified, called when platform was detected as such: callbackDone(res) where res can be:
		//					true	= if success
		//					Error string = if error

		try
		{
			//Assume general case
			//		= 0 if other platform
			//		= 1 if running on OS X
			//		= 2 if running on Windows
			//		= 3 if running on Linux
			gl.gPlatform = 0;

			if(chrome.runtime.getPlatformInfo)
			{
				//Determine asynchronously
				chrome.runtime.getPlatformInfo(function(info) 
				{
					//Remember it
					gl.gOSInfo.os = info.os;				//String that describes the OS (example: "mac", "win", "android", etc.)
					gl.gOSInfo.arc = info.arch;				//Architecture (example: "arm", "x86-32", or "x86-64", etc.)

					//See what we've got
					if(info.os == "mac")
						gl.gPlatform = 1;
					else if(info.os == "win")
						gl.gPlatform = 2;
					else if(info.os == "linux")
						gl.gPlatform = 3;

					//Notify
					if(callbackDone)
						callbackDone(true);
				});
			}
			else
			{
				//Use old method -- it is less reliable
				//For possible values check: http://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
				var nvg = navigator.platform;

				//Remember it
				gl.gOSInfo.os = nvg;				//String that describes the OS (example: "mac", "win", "android", etc.)
				gl.gOSInfo.arc = "";				//Architecture (example: "arm", "x86-32", or "x86-64", etc.)

				//Check for word boundaries with the \b flag
				if(/\bmac/gi.test(nvg))
					gl.gPlatform = 1;
				else if(/\bwin/gi.test(nvg))
					gl.gPlatform = 2;
				else if(/\blinux/gi.test(nvg))
					gl.gPlatform = 3;

				//Notify
				if(callbackDone)
					callbackDone(true);
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(115, e);

			//Error
			if(callbackDone)
				callbackDone("[249] Err: " + e.message);
		}
	},


	setTimer_FormDataCollection: function()
	{
		//Set repeating timer that fires repeatedly when the background script needs to collect form data from the active tab
		//INFO: If the timer was previously set, it will be reset in this method

		//Do we have a previous timer
		if(gl.__gnTimerID_FrmDtaCol)
		{
			//Stop previous timer
			window.clearInterval(gl.__gnTimerID_FrmDtaCol);
			gl.__gnTimerID_FrmDtaCol = null;
		}

		//Normalize the repeat period
		var nPeriodMs = parseInt(gl.gSettings.nCollectFormDataFreqMs, 10);
		if(isNaN(nPeriodMs) || nPeriodMs < 1000)
			nPeriodMs = 1000;

		//Set periodic timer
		gl.__gnTimerID_FrmDtaCol = window.setInterval(gl.updateInfoFromActiveTab, nPeriodMs);

		console.log("[246] Set data collection timer to " + nPeriodMs);

	},
	__gnTimerID_FrmDtaCol: null,					//DO NOT USE directly



	setTimer_PersistDataSave: function()
	{
		//Set repeating timer that fires repeatedly when the collected data in 'gl.oStorage' needs to be saved in persistent storage
		//INFO: If the timer was previously set, it will be reset in this method

		//Do we have a previous timer
		if(gl.__gnTimerID_PrstDtaSv)
		{
			//Stop previous timer
			window.clearInterval(gl.__gnTimerID_PrstDtaSv);
			gl.__gnTimerID_PrstDtaSv = null;
		}

		//Normalize the repeat period
		var nPeriodMs = parseInt(gl.gSettings.nSavePersistDataFreqMs, 10);
		if(isNaN(nPeriodMs) || nPeriodMs < 1000)
			nPeriodMs = 1000;

		//Set periodic timer
		gl.__gnTimerID_PrstDtaSv = window.setInterval(function()
		{
			//Called periodically
			gl.onPersistentSaveStorage(false);		//Save only if data was "modified"

		}, nPeriodMs);

		console.log("[247] Set persistent storage save timer to " + nPeriodMs);
	},
	__gnTimerID_PrstDtaSv: null,					//DO NOT USE directly



	reinjectCSIntoAllTabs: function()
	{
		//Enumerate all open tabs and programmatically inject content.js into them
		//INFO: This is needed when the app is reloaded
		//WARNING: This method does the injection asynchronously after it returns!

		try
		{
			//Get content script from manifest.json
			var manifest = chrome.runtime.getManifest();
			var objCSs = manifest.content_scripts[0];

			//Get all windows
			chrome.windows.getAll({populate: true}, function(wnds)
			{
				//Go through all windows
				for(var w = 0; w < wnds.length; w++)
				{
					var tabs = wnds[w].tabs;

					//Go through all tabs in a window
					for(var t = 0; t < tabs.length; t++)
					(function()								//We need "closure" here to allow 'tabUrl' to be preserved inside the callback for chrome.tabs.executeScript() More here: http://stackoverflow.com/q/25839819/843732
					{
						var tab = tabs[t];
						var tabUrl = tab.url;

						//Inject into this tab
						try
						{
							chrome.tabs.executeScript(tab.id, {
								file: objCSs.js[0],
								allFrames: objCSs.all_frames,
								matchAboutBlank: objCSs.match_about_blank
							}, function(arrRes)
							{
								//After the scripts were injected, or if an error occurred
								if(chrome.runtime.lastError)
								{
									//Failed -- this may be because the tab did not fit the "matches" clause in the manifest.json
									//INFO: So we'll go with just ignoring this exception until a better solution is known!
									//More info:	http://stackoverflow.com/q/25839547/843732
							//		console.error("[157] INJ ERR: " + chrome.runtime.lastError.message);
								}
								//else
								//{
								//	//Injected OK
								//	console.log("[158] INJ OK: " + tabUrl);
								//}
							});
						}
						catch(e)
						{
							//Failed -- this may be because the tab did not fit the "matches" clause in the manifest.json
							//INFO: So we'll go with just ignoring this exception until a better solution is known!
							//More info:	http://stackoverflow.com/q/25839547/843732
						}
					})();
				}

			});
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(156, e);
		}
	},


	updateOptionsPage: function()
	{
		//Request an update from the Options page
		//INFO: Does nothing if it is not shown

		try
		{
			//Get options page URL
			var urlOptions = chrome.extension.getURL('options.html');

			//Query for the tab
			chrome.tabs.query({ url: urlOptions }, function (tabs)
			{
				//Go through all tabs found
				for(var t = 0; t < tabs.length; t++)
				{
					//Send special message
					chrome.tabs.sendMessage(tabs[t].id, {
						action: "update03"
						}, 
						function(response) 
					{
						//Check if we failed to send message to this tab
						if(chrome.runtime.lastError)
						{
							//Failed to send
						}
					});
				}
			});
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(228, e);
		}
	},


//	getFolderName: function(strPath)
//	{
//		//RETURN:
//		//		= Folder name from the path (no slashes)
//		if(!strPath)
//			return "";

//		strPath = strPath.toString();

//		var fnd = strPath.lastIndexOf('/');
//		if(fnd === -1)
//			fnd = strPath.lastIndexOf('\\');

//		if(fnd !== -1)
//			return strPath.substr(fnd + 1, strPath.length - fnd - 1);
//		else
//			return strPath;
//	},


	getLangEngNameByLangID: function(langID)
	{
		//Get language English name by 'langID'
		//'langID' = language ID - case-insensitive. Example: "en", "en_GB", etc.
		//				INFO: Can be one of the "Locale code" values from here: https://developer.chrome.com/webstore/i18n?csw=1#localeTable
		//RETURN:
		//		= Language name (in English), or
		//		= "" if not found

		//Normalize the ID
		langID = langID ? langID.toString().toLowerCase() : "";

		//Get full list
		var objAll = gl.getFullUILangList();

		var resName = objAll[langID];

		return resName ? resName : "";
	},


	getFullUILangList: function()
	{
		//RETURN: Object with all supported languages by Chrome
		//			Source: https://developer.chrome.com/webstore/i18n?csw=1#localeTable
		return {
		//IMPORTANT: All keys must be in lower case!!!
			ar:	"Arabic",
			am:	"Amharic",
			bg:	"Bulgarian",
			bn:	"Bengali",
			ca:	"Catalan",
			cs:	"Czech",
			da:	"Danish",
			de:	"German",
			el:	"Greek",
			en:	"English",
			en_gb:	"English (Great Britain)",
			en_us:	"English (USA)",
			es:	"Spanish",
			es_419:	"Spanish (Latin America and Caribbean)",
			et:	"Estonian",
			fa:	"Persian",
			fi:	"Finnish",
			fil:	"Filipino",
			fr:	"French",
			gu:	"Gujarati",
			he:	"Hebrew",
			hi:	"Hindi",
			hr:	"Croatian",
			hu:	"Hungarian",
			id:	"Indonesian",
			it:	"Italian",
			ja:	"Japanese",
			kn:	"Kannada",
			ko:	"Korean",
			lt:	"Lithuanian",
			lv:	"Latvian",
			ml:	"Malayalam",
			mr:	"Marathi",
			ms:	"Malay",
			nl:	"Dutch",
			no:	"Norwegian",
			pl:	"Polish",
			pt_br:	"Portuguese (Brazil)",
			pt_pt:	"Portuguese (Portugal)",
			ro:	"Romanian",
			ru:	"Russian",
			sk:	"Slovak",
			sl:	"Slovenian",
			sr:	"Serbian",
			sv:	"Swedish",
			sw:	"Swahili",
			ta:	"Tamil",
			te:	"Telugu",
			th:	"Thai",
			tr:	"Turkish",
			uk:	"Ukrainian",
			vi:	"Vietnamese",
			zh_cn:	"Chinese (China)",
			zh_tw:	"Chinese (Taiwan)"
			};
	},


	getAcceptedLangIDs: function(callbackDone)
	{
		//Get list of language ID codes supported by the web browser
		//'callbackDone' = method that is called with the result as such: callbackDone(arrLangIDs), where 'callbackDone' is:
		//					= [string] Language ID code, always lower case with dashes "-" replaced with underscores "_" (example: "en_us", "de", etc.)

		//Get current UI languages
		chrome.i18n.getAcceptLanguages(function(arrAccLangs)
		{
			//Adjust the array of supported languages
			var langID;
			for(var i = 0; i < arrAccLangs.length; i++)
			{
				langID = arrAccLangs[i];
				arrAccLangs[i] = langID ? langID.toString().toLowerCase().replace(/-/g, "_") : "";
			}

			if(callbackDone)
				callbackDone(arrAccLangs);
		});
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

		try
		{
			//Get to our folder
			chrome.runtime.getPackageDirectoryEntry(function(root)
			{
				//Open the main locales
				root.getDirectory("_locales", {create: false}, function(lsDir) 
				{
					var reader = lsDir.createReader();

					//INFO: https://developer.mozilla.org/en-US/docs/Web/API/DirectoryReader#readEntries
					var entries = [];

					//Keep calling readEntries() until no more results are returned.
					var _readEntries = function() 
					{
						reader.readEntries(function(results)
						{
							if(!results.length)
							{
								//All done!

								//Return result?
								if(callbackDone)
									callbackDone(true, !bSort ? entries : entries.sort());
							} 
							else
							{
								//More entries available
								var _toArray = function(lst) {
								  return Array.prototype.slice.call(lst || [], 0);
								}

								//Convert to array
								var arrRes = _toArray(results);

								//Get folder names only
								var langID;
								for(var i = 0; i < arrRes.length; i++)
								{
									langID = arrRes[i];
									langID = langID && langID.name ? langID.name.toString() : "";

									//Do we need to normalize?
									if(bNormalize)
									{
										langID = langID.toLowerCase().replace(/-/g, "_");
									}

									arrRes[i] = langID;
								}

								//Keep trying until we get an empty array
								entries = entries.concat(arrRes);
								_readEntries();
							}
						}, 
						function(e)
						{
							//Error reading
							if(callbackDone)
								callbackDone("[295] ERR: " + e.name + ". Path='" + lsDir.fullPath + "' " + e.message, []);
						});
					};

					//Begin reading
					_readEntries();

				},
				function(e)
				{
					//Error
					if(callbackDone)
						callbackDone("[294] ERR: " + e.name + ". " + e.message, []);
				});
			});
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(293, e);

			if(callbackDone)
				callbackDone("[296] ERR: " + e.message, []);
		}
	},


	getLangUIAsJSON: function(langID, callbackDone)
	{
		//Read translation data for the language as JSON
		//'langID' = language ID, case-insensitive. For possible values check:
		//				https://developer.chrome.com/webstore/i18n?csw=1#localeTable
		//'callbackDone' = if specified, will be called with the result as such: callbackDone(res, objJsn), where:
		//					'res' =			could be:
		//										= true if success, check 'objJsn'
		//										= Error description if error
		//					'objJsn' =		object containing data read, or {} if error

		try
		{
			if(langID)
			{
				var xmlR = new XMLHttpRequest();

				//Open asynchronously
				xmlR.open("GET", chrome.runtime.getURL("/_locales/" + langID + "/messages.json"), true);

				//Send response processor
				xmlR.onreadystatechange = function()
				{
					try
					{
						//See the state:
						//0	UNSENT	open()has not been called yet.
						//1	OPENED	send()has not been called yet.
						//2	HEADERS_RECEIVED	send() has been called, and headers and status are available.
						//3	LOADING	Downloading; responseText holds partial data.
						//4	DONE	The operation is complete.
						if(xmlR.readyState == 4)
						{
							//See if success
							if(xmlR.status == 200)
							{
								//var rr = "john-and-jet got-a-place.";
								//var ss = rr.replace(/-/g, "_");

								//Got it, now convert to JSON
								//INFO: The strings in JSON cannot contain the following:
								//			= New-lines	(use \n instead)
								//			= Tabs!	(use \t instead)
								//			= Double-quote	(use \" instead)
								//			= Slash \ (use \\ instead)
								//For more check:
								//			http://stackoverflow.com/a/26309470/843732

								//Replace existing tabs with spaces
								var objJsn = JSON.parse(xmlR.responseText.toString().replace(/\t/g, " "));

								//Done!
								if(callbackDone)
									callbackDone(true, objJsn);
							}
							else
							{
								//Failed to get
								if(callbackDone)
									callbackDone("[303] ERR: Status=" + xmlR.status, {});
							}
						}
					}
					catch(e)
					{
						//Exception
						gl.logExceptionReport(301, e);

						if(callbackDone)
							callbackDone("[302] ERR: " + e.message, {});
					}
				};

				//Begin
				xmlR.send();
			}
			else
			{
				//Bad ID
				if(callbackDone)
					callbackDone("[300] Bad LangID", {});
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(298, e);

			if(callbackDone)
				callbackDone("[299] ERR: " + e.message, {});
		}
	},


	_sanitizeUrl: function(url)
	{
		//Replace URL's part by keeping only the protocol
		//RETURN:
		//		= Sanitized URL

		//Trim it
		url = url ? url.trim() : "";

		if(!url)
			return "";

		//Only if it's a dot
		if(url == '.')
			return url;

		var m;

		//See if special urls that should be kept:
		//INFO: They can also start with 0> or 1_0> prefix
		//	about:
		//	chrome-extension://
		m = url.match(/\b(?:[\d_]+>)?(about\:|chrome-extension\:\/\/){1}/i);
		if(m && m.length > 1)
		{
			//Keep this URL as-is
			return url;
		}

		//Assume that it can start with "2>" for IFRAME index, followed by protocol http:// etc.
		m = url.match(/\b((?:[\d_]+>)?.+?\:\/\/(?:www\.)?)/i);
		if(m)
		{
			return m[1] + " ... <Len:" + url.length + ">";
		}

		//Return URL length
		return "<len=" + url.length + ">";
	},

	_sanitizeUrlsInStr: function(str)
	{
		//Replace URLs in 'str' by keeping only their protocols
		//RETURN:
		//		= Sanitized string

		if(!str)
			return "";

		//Sanituze it
		return str.replace(/(\S+\:\/\/(?:www\.)?)(?:\S+)/gi, "$1 ...");
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

		try
		{
			//Stringify settings object
			var strSttgs = bPretty !== true ? JSON.stringify(gl.gSettings) : JSON.stringify(gl.gSettings, null, '   ');

			//Add comment to the beginning with what version and when saved
			var strHeader = '/*##[ %nm%="' + gl.gstrAppName + '"; %tp%="' + strDataID + '"; %ver%="' + gl.getThisAppVersion() + '"; %dt%="' + gl.getCurrentTimeUTC() + '"; ]##*/\n';
			strSttgs = strHeader + strSttgs;

			if(nExtras)
			{
				//Prep extras

				//Get usage
				//	1 = localStorage
				//	2 = chrome.storage.local
				gl.getCurrentPersistStorageUsage(1, function(nSz1)
				{
					//'nSz1' = one of:
					//					= [Integer] for the usage in bytes
					//					= -1 if error or unknown

					//Get usage
					//	1 = localStorage
					//	2 = chrome.storage.local
					gl.getCurrentPersistStorageUsage(2, function(nSz2)
					{
						//'nSz2' = one of:
						//					= [Integer] for the usage in bytes
						//					= -1 if error or unknown

						try
						{
							//Make a copy of 'gl.oTabsData' and sanitize it
							var _oTabsData = $.extend(true, {}, gl.oTabsData);

							if(nExtras == 1)
							{
								//Go through all entries
								for(var kTab in _oTabsData)
								{
									var objTab = _oTabsData[kTab];

									//Remove 'pageURL'
									objTab.pageURL = gl._sanitizeUrl(objTab.pageURL);

									//Page title
									var title = objTab.pageData.ttl;
									if(title)
									{
										objTab.pageData.ttl = "<len=" + title.length + ">";
									}

									//Fav icon
									objTab.pageData.fav = gl._sanitizeUrl(objTab.pageData.fav);

									var objFrms = objTab.pageData.frms;
									var objFrms2 = {};						//Collect sanitized entries
									var c = 0;

									//Go through all IFRAMEs data
									for(var kFrm in objFrms)
									{
										var objFrm = objFrms[kFrm];

										//Remove collected text
										var arrTxt = objFrm.dta;
										if(arrTxt)
										{
											for(var t = 0; t < arrTxt.length; t++)
											{
												var txt = arrTxt[t].val;
												if(txt)
												{
													arrTxt[t].val = "<len=" + txt.length + ">";
												}
											}
										}

										//Sanitize the key itself
										var kFrm2 = gl._sanitizeUrl(kFrm) + " <:" + c + ">";
										c++;

										//Remember it
										objFrms2[kFrm2] = objFrms[kFrm];
									}

									//Remove old IFRAMEs object
									delete objTab.pageData.frms;

									//And add new (sanitized) object
									objTab.pageData.frms = objFrms2;
								}
							}

							//Get max size
							//		= [Integer] for the maximum size of the persistent storage in bytes
							//		= 0 if error or unknown
							var nMaxSz1 = gl.getMaxPersistStorageSize(1);
							var nMaxSz2 = gl.getMaxPersistStorageSize(2);

							//Extra
							var objXtras = {
								//	1 = localStorage
								persistStgMaxSz_1: nMaxSz1,															//Max available in bytes
								persistStgUsgBytes_1: nSz1,															//Usage value in bytes
								persistStgUsgPerc_1: nMaxSz1 > 0 && nSz1 >= 0 ? nSz1 * 100 / nMaxSz1 : "-",			//Percent usage value

								//	2 = chrome.storage.local
								persistStgMaxSz_2: nMaxSz2,															//Max available in bytes
								persistStgUsgBytes_2: nSz2,															//Usage value in bytes
								persistStgUsgPerc_2: nMaxSz2 > 0 && nSz2 >= 0 ? nSz2 * 100 / nMaxSz2 : "-",			//Percent usage value

								bEnabledCollect: gl.oBadge ? gl.oBadge.bEnabledCollect : "-",
								gnMaxExcepts: gl.gnMaxExcepts,

								oStorage_Len: Object.keys(gl.oStorage).length,										//Number of entries in 'gl.oStorage'
								gbMod_oStorage: gl.gbMod_oStorage,

								oTabsData_Len: Object.keys(gl.oTabsData).length,									//Number of entries in 'gl.oTabsData'
								oTabsData: _oTabsData
							};


							//Export it into JSON
							var strXtras = bPretty !== true ? JSON.stringify(objXtras) : JSON.stringify(objXtras, null, '   ');

							//Add header
							strXtras = '\n\n/*##[ %tp%="memObjReport"; ]##*/\n' + strXtras;

							//Add console cache
							//				1 = include extra global values (remove user-sensitive info)
							//				2 = include extra global values (nothing is removed)
							//				0 = do not include anything extra
							strXtras += '\n\n/*##[ %tp%="consoleReport"; %cnt%="' + gl.gConsoleCache.length + '" ]##*/\n' + gl.getConsoleCacheAsStr(nExtras == 2);

							//Return result
							if(callbackDone)
								callbackDone(strSttgs + strXtras);

						}
						catch(e)
						{
							//Exception
							gl.logExceptionReport(306, e);

							if(callbackDone)
								callbackDone(null);
						}
					});
				});
			}
			else
			{
				//Return result
				if(callbackDone)
					callbackDone(strSttgs);
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(307, e);

			if(callbackDone)
				callbackDone(null);
		}
	},

	openURL: function(url)
	{
		//Open URL in a new tab
		//INFO: Opens it whether a tab with such URL already existed or not!
		//'url' = URL to open
		try
		{
			if(url)
			{
				url = url.trim();
				if(url)
				{
					//See if it begins with *://
					if(!url.match(/^.*\:\/\//))
					{
						//Assume http://
						url = 'http://' + url;
					}

					//Then open site in a new tab
					chrome.tabs.create({ url: url });
				}
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(304, e);
		}
	},


	openFAQPageIfNotOpened: function(nQNumber)
	{
		//Open our online FAQ page if it's not already opened
		//'nQNumber' = if specified, must be set to question number to display (example: "2" for question #2)

		//Open page
		gl.openPageIfNotOpened("http://dennisbabkin.com/php/faq.php?what=formalizr" + (nQNumber ? "#" + nQNumber : ""));
	},

	openContactPageIfNotOpened: function(bBugReport, strInfo)
	{
		//Open software feedback or bug report page, if it doesn't already exist (otherwise it switches to that tab or window)
		//'bBugReport' = true for bug report page, otherwise software feedback
		//'strInfo' = if specified, information to pass into report (keep it short though!)

		//Get current UI languages
		gl.getAcceptedLangIDs(function(arrAccLangs)
		{
			//Get current time
			var dtNow = new Date();

			//Make UI langs
			var strUIs = "";
			for(var i = 0; i < arrAccLangs.length; i++)
			{
				if(strUIs)
					strUIs += ", ";

				strUIs += arrAccLangs[i];
			}

			//Get user's chosen UI
			var curLocale = chrome.i18n.getMessage("@@ui_locale");

			//Make short technical report
			var strDesc = "DATE: " + dtNow.getFullYear() + "-" + (dtNow.getMonth() + 1).toString() + "-" + dtNow.getDate() + " " + 
				dtNow.getHours() + ":" + dtNow.getMinutes() + ":" + dtNow.getSeconds() + " (" + (-dtNow.getTimezoneOffset() / 60).toString() + "h)\n" +
				"OS: " + gl.gOSInfo.os + (gl.gOSInfo.arc ? ", BRWSR: " + gl.gOSInfo.arc : "") + "\n" +
				"UI: [" + curLocale + "] " + strUIs;

			//Do we have additional info?
			if(strInfo)
			{
				strDesc = strInfo.trim() + "\n" + strDesc;
			}

			var strTgtUrl = "http://www.dennisbabkin.com/sfb/";

			var objData = {
				what: bBugReport ? "glitch" : "info",
				name: gl.gstrAppName,
				ver: gl.getThisAppVersion(),
				desc: strDesc
			};

			//Make the tail URL
			var strTail = "?what=" + encodeURIComponent(objData.what) + 
				"&name=" + encodeURIComponent(objData.name) + 
				"&ver=" + encodeURIComponent(objData.ver) +
				"&desc=" + encodeURIComponent(objData.desc);

			//Only if tail is not too long
			if(strTgtUrl.length + strTail.length < 256)
			{
				//Open contact page (using GET request)
				gl.openPageIfNotOpened(strTgtUrl, strTail);
			}
			else
			{
				//Otherwise open it using POST request
				gl.openPageAsPost(strTgtUrl, objData);
			}
		});
	},


	openPageAsPost: function(url, data, target)
	{
		//Open 'url' and pass it 'data' as POST request
		//'url' = URL to open
		//'data' = object with data to pass. Each key represents the name of parameter and its value - value of the parameter (no URL encoding is needed!)
		//'target' = target window. If omitted "_blank", or new window is used by default

		try
		{
			var form = document.createElement("form");
			form.action = url;
			form.method = "POST";
			form.target = target || "_blank";
			if(data)
			{
				for(var key in data) 
				{
					var input = document.createElement("input");
					input.type = "hidden";
					input.name = key;
					input.value = data[key];
					form.appendChild(input);
				}
			}

			form.style.display = 'none';
			document.body.appendChild(form);
			form.submit();
			document.body.removeChild(form);
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(313, e);
		}
	},


	openPageIfNotOpened: function(openUrl, tailUrl)
	{
		//Open 'openUrl' in a new tab, if it doesn't already exist (otherwise it switches to that tab or window)
		//'tailUrl' = if specified, must contain the tail section of the URL. Example: "?v=something&w=1"
		try
		{
			//Query for the URL
			chrome.tabs.query({ url: openUrl + "*" }, function (tabs)
			{
				//Did we get any tabs?
				if(tabs.length)
				{
					//Found it somewhere 

					//Get current window
					chrome.windows.getCurrent({populate: false}, function(wnd)
					{
						//Get the first tab found
						var tab = tabs[0];

						//Is it the current window?
						if(wnd.id != tab.windowId)
						{
							//Switch to another window, if it's not and focus it
							chrome.windows.update(tab.windowId, { focused: true });
						}

						//Then switch to the tab where we found it
						chrome.tabs.update(tab.id, { active: true });
					});
				}
				else
				{
					//If not found, create a new tab with the URL
					chrome.tabs.create({ url: openUrl + (tailUrl ? tailUrl : "") });
				}
			});
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(180, e);
		}
	},


	openAppSettingsWindow: function(strTabID)
	{
	    //Opens up the Settings window
	    //INFO: If it was already shown, it will shown in the same tab
		//'strTabID' = if specified, tab ID to show (example: "tabGeneral")
	    gl.openPageIfNotOpened(chrome.extension.getURL('options.html'), strTabID ? '?p=' + encodeURIComponent(strTabID) : null);
	},
	
	openGeneralSettingsWindow: function()
	{
		//Open Chrome general settings, if no alreadt opened (in that case it switches to that tab or window)
		gl.openPageIfNotOpened("chrome://extensions/");
	},

	openAppInfoWindow: function(strTabID)
	{
	    //Opens up the Info window
	    //INFO: If it was already shown, it will shown in the same tab
		//'strTabID' = if specified, tab ID to show (example: "tabAbout")
	    gl.openPageIfNotOpened(chrome.extension.getURL('info.html'), strTabID ? '?p=' + encodeURIComponent(strTabID) : null);
	},
	

	defineDefaultSettings: function()
	{
		//Must be called at the very beginning when the page loads to define the default settings values
		//MUST BE CALLED ONLY ONCE!
		if(!gl.__gDefSttgsDefnd)
		{
			//Set flag
			gl.__gDefSttgsDefnd = true;

			//Set this app's version in settings (we'll need it later for loading/saving settings in persistent storage)
			gl.gSettings.appVersion = gl.getThisAppVersion();

			//Make a "deep" copy of default settings
			gl.gSettings_Default = $.extend(true, {}, gl.gSettings);

			//Get platform name
			//		= 0 if other platform
			//		= 1 if running on OS X
			//		= 2 if running on Windows
			//		= 3 if running on Linux
			var ptfmName = "";
			switch(gl.gPlatform)
			{
				case 1: ptfmName = "OS X"; break;
				case 2: ptfmName = "Windows"; break;
				case 3: ptfmName = "Linux"; break;
				default: ptfmName = "Other"; break;
			}

			console.log("[248] Detected platform: " + gl.gPlatform + " (" + ptfmName + "), appVer=" + gl.gSettings.appVersion);

			//Set default new-lines depending on the platform we're running on
			//		= 0 if other platform
			//		= 1 if running on OS X
			//		= 2 if running on Windows
			//		= 3 if running on Linux
			switch(gl.gPlatform)
			{
				case 1:
					//	2 =		Use OS X/Linux/Unix newlines: \n   (LF)
					gl.gSettings_Default.nCopySubstNewLines = 2;
					break;
				case 2:
					//	1 =		Use Windows newlines: \r\n   (CR+LF)
					gl.gSettings_Default.nCopySubstNewLines = 1;
					break;
				case 3:
					//	2 =		Use OS X/Linux/Unix newlines: \n   (LF)
					gl.gSettings_Default.nCopySubstNewLines = 2;
					break;
				default:
					//	0 =		No change
					gl.gSettings_Default.nCopySubstNewLines = 0;
					break;
			}

		}
		else
		{
			//Error
			console.error("[245] Repeated calls not allowed");
		}
	},
	__gDefSttgsDefnd: false		//[Internal use only!]

	
};




//!!!First thing!!!! -- make sure to override the console calls
gl.overrideGlobConsole();


//Determine the platform we're running on
gl.determinePlatform(function(resPltfrm)
{
	//Define default settings
	gl.defineDefaultSettings();

	//Load singletons
	gl.gSngltnPrmpts.loadSingletons();


	//Load settings values from persistent storage
	gl.onPersistentLoadSettings(function(resSttgs)
	{
		//Did we get settings OK?
		//						= true - if loaded successfully
		//						= String - if not loaded, has error message
		if(resSttgs !== true)
		{
			//Error
			console.error("[200] Failed to load settings from persistent storage, reset settings to defaults: " + resSttgs);
		}
	
		//Load storage object from persistent object (and wait for the result)
		gl.onPersistentLoadStorage(function(resLoad)
		{
			try
			{
				//Loaded global storage from persistent storage
				console.log("[141] Result instantiating global data from persistent storage: " + resLoad + ". StorageType: " + gl.gSettings.nPersistStorageType);
	
				//Set default badge icon
				gl.updateIconAndBadge_Default(gl.gSettings.bCollectData);
	
	
				//Main message processor
				chrome.runtime.onMessage.addListener(
					function(request, sender, sendResponse)
					{
						//See what type of message is it
						if(request.action == "update00")
						{
							//Called when content script first loads in the page
							sendResponse({dta: gl.getSettingsForContent(), res: 99});
						}
						else if(request.action == "update01")
						{
							//Called with form data
							gl.processFormData(request, sender.tab.id);
						}
						else if(request.action == "reqUpdate01")
						{
							//Update data for the tab that sent this message
							gl.updateInfoFromTab(sender.tab.id);
	
							//console.log("ReqUpdate, tabID=" + sender.tab.id);
						}
						else if(request.action == "logmsg")
						{
							//Log message
							console.log(request.msg);
						}

						//return true;		//If needed to indicate async response: http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
					}
				);
	
	
				////Message to track when the app is about to be unloaded
				//window.onunload = function()					//Is never called!!!!
				//{
				//	//Called before the extension is unloaded
				//	gl.onPersistentSaveStorage();
				//	console.log("<<UNLOAD");
				//};
	
	
				chrome.tabs.onUpdated.addListener(
					function(tabId, changeInfo, tab) 
					{
						//Called when user updates tab URL
						try
						{
							//console.log("Updtaed TabID: " + tabId + ", ci=" + changeInfo.status + ", tab=" + tab.status);

							if(changeInfo.status != 'loading')
							{
								//New page URL is detected
							//	console.log("Updtaed TabID: " + tabId + ", v=" + changeInfo.url);
					
								//Remove that tab data object
								delete gl.oTabsData[tabId];
	
								//Update info for the tab
								gl.updateInfoFromTab(tabId);
							}
				
						}
						catch(e)
						{
							//Exception
							gl.logExceptionReport(102, e);
						}
					}
				);
	
	
	
				chrome.tabs.onActivated.addListener(
					function(activeInfo) 
					{
						//Called when user activates the tab
						try
						{
							//Update icon
							gl.updateIconAndBadge_Tab(activeInfo.tabId);
				
							//Update info
							gl.updateInfoFromTab(activeInfo.tabId);
						}
						catch(e)
						{
							//Exception
							gl.logExceptionReport(105, e);
						}
					}
				);
	
	
				chrome.tabs.onRemoved.addListener(
					function(tabId, removeInfo)
					{
						//Fired when a tab is closed
						try
						{
							//Remove that tab data object
							delete gl.oTabsData[tabId];
				
							//console.log("Closed TabID: + " + tabId + ", oTabsData-Size=" + Object.keys(gl.oTabsData).length);
				
							//And save collected data in persistent storage
							//INFO: This is needed because there's no notification when this app is reloaded or Chrome is closed!
							gl.onPersistentSaveStorage(false);
						}
						catch(e)
						{
							//Exception
							gl.logExceptionReport(101, e);
						}
					}
				);
	

				chrome.storage.onChanged.addListener(
					function(changes, areaName)
					{
						//Called when persistent storage data changes
						if(changes &&
							areaName == 'sync')
						{
							//Only if our settings key was changed
							if(gl.gstrPersistSettingsKeyName in changes)
							{
								//We need to update our settings if the "sync" storage changes
								console.log("[204] Settings sync data change notification");

								//See what changed
								var stgChng = changes[gl.gstrPersistSettingsKeyName];

								//Start asynchronously in 1ms
								window.setTimeout(function(oldValue, newValue)
								{
									//Load settings into cache
									gl.onPersistentLoadSettings(function(res)
									{
										//						= true - if loaded successfully
										//						= String - if not loaded, has error message
										if(res === true)
										{
											////Did we get before and after states
											//if(oldValue &&
											//	newValue)
											//{
												//Update existing tabs depending on the change
												gl.onAfterPersistentSettingsChange(oldValue, newValue);
											//}
											//else
											//{
											//	//Bad state
											//	console.error("[211] Bad state passed: old=" + oldValue + ", new=" + newValue);
											//}
										}
										else
										{
											//Error setting
											console.error("[205] Settings update failed: " + res);
										}
									});
								}, 
								1, stgChng.oldValue, stgChng.newValue);
							}
						}
					}
				);
	
	
				//Add listener for the updates to this app
				chrome.runtime.onUpdateAvailable.addListener(
					function(details)
					{
						//Is called when update is available
						console.log("Update was detected, v." + (details ? details.version : "?") + ". Will attempt app restart...");
	
						//And process it
						gl.onInstallUpdate();
					}
				);
	
	
				//The following hack is required to track instances when popup window is opened and closed
				chrome.runtime.onConnect.addListener(
					function(port) 
					{
						port.onMessage.addListener(
							function(msg) 
							{
								if(msg.action == "init")
								{
									gl.popupWindowShown(true);
								}
							}
						);
			
						port.onDisconnect.addListener(
							function()
							{
								gl.popupWindowShown(false);
							}
						);
					}
				);
	

	
				//Start timers that will periodically collect data & save it in persistent storage
				gl.setTimer_FormDataCollection();
				gl.setTimer_PersistDataSave();
	
	
	
				//Reinject content script into all existing/open tabs
				//INFO: Must be called after all event listeners are set up!
				gl.reinjectCSIntoAllTabs();
			}
			catch(e)
			{
				//Exception
				gl.logExceptionReport(175, e);
			}
		});
	});

});



//Add first-installation & app update listeners
//INFO: Must be on a global scale as otherwise it doesn't work!
chrome.runtime.onInstalled.addListener(
	function(details)
	{
		//See what happened
		if(details.reason == "install")
		{
			//First install
			console.log("[291] First Formalizr installation, v." + gl.getThisAppVersion());

			//Call notification
			gl.onFirstInstall();
		}
		else if(details.reason == "update")
		{
			//Was this app was updated?
			var thisVer = gl.getThisAppVersion();

			//		= 0 if both are the same
			//		= 1 if v1 > v2
			//		= -1 if v1 < v2
			//		= NaN if error
			if(gl.compareVersions(details.previousVersion, thisVer) !== 0)
			{
				console.log("[292] Updated Formalizr from v." + details.previousVersion + " to v." + thisVer);
			}
		}
	}
);
	
	
