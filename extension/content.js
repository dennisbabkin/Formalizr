// Content JavaScript -- it is injected in all HTTP and HTTPS tabs loaded in the Chrome browser (including IFRAMEs)

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
	gSettings: {					//Global settings (cached & updated from the background script)
		//
		//INFO: The following fall-back values will be used until this content script connects to background.js and retrieves them!
		//
		nCollectFlgs: 0xFFFFFFF,	//Bitwise integer specifying which textboxes to collect: see 'gl.gSettings.nCollectFlgs' in background.js
		nCollectMax: 128,			//[1 and up) Maximum number of textboxes to collect
		bCollectData: true,			//true to allow data collection from visted web pages (overrides 'bIncogCollectData')
		bIncogCollectData: true		//true to allow data collection from visted web pages opened in the "Incognito" tabs (can be overridden by 'bCollectData')
	},

	//giFrameID: null,			//If not null, contains unique iframe ID for this iframe
	
	collectAllFormData: function()
	{
		//Collect data about all form elements on this page
		//RETURN:
		//			= Object with the following props:
		//				'dt' =		Array with collected form data, that contains objects with the following props:
		//								'id' =	HTML id of the element
		//								'nm' =	HTML name of the element
		//								'tp' =	HTML type of the element (always lower-case). Can be one of the <input> types, as well as "textarea" or ">ce" for contentEditable element
		//								'si' =	[Integer] Sequential index for this textbox (can be used to uniquely ID textboxes in the iframe)
		//								'val' =	Text in the textbox (cannot be "" or contain white-spaces)
		//				'rs' =		[Integer] One of the following:
		//							 1 = if all available textboxes were collected
		//							 0 = if had to stop at 'nCollectMax' number textboxes but more were available
		//							 -1 = if error collecting
		var arrData = [];
		var res = 1;
		
		try
		{
			//Get flags to collect
			var flgs = this.gSettings.nCollectFlgs;
			
			//Do we need any of these elements?
			// 0x4 =		collect input: text
			// 0x8 =		collect input: email
			// 0x10 =		collect input: number
			// 0x20 =		collect input: search
			// 0x40 =		collect input: tel
			// 0x80 =		collect input: url
			if(flgs & 0xfc)
			{
				//Check for input elements
				var frmTbx = document.getElementsByTagName("input");
				if(frmTbx)
				{
					var nSi0 = 0;		//Value special for <input> elements
					for(var i = 0; i < frmTbx.length; i++, nSi0++)
					{
						var elmt = frmTbx[i];

						var type = this.isObjAcceptable(elmt, flgs);
						if(type)
						{
							//Do we need to collect text?
							//INFO: We'll wait for a user input before we collect any data
							if(gl.isElmtCollectable(elmt))
							{
								//Make sure that text is not empty
								var txt = elmt.value;
								if(!this.isWhitespaceEmptyString(txt))
								{
									//Limit how many textboxes we can collect
									if(arrData.length >= this.gSettings.nCollectMax)
									{
										res = 0;
										break;
									}

									//Use it
									arrData.push({
										id: elmt.id,
										nm: elmt.name,
										tp: type,
										si: nSi0,
										val: txt
										});
								}
							}
						}
					}
				}
			}
			
			//Do we need textarea elements?
			if(flgs & 0x1)				// 0x1 =		collect textarea
			{
				//Check for textarea elements
				var frmTxa = document.getElementsByTagName("textarea");
				if(frmTxa)
				{
					var nSi1 = 0x10000;		//Value special for <textarea> elements
					for(var i = 0; i < frmTxa.length; i++, nSi1++)
					{
						var elmt = frmTxa[i];

						//See if we need this element
						var type = this.isObjAcceptable(elmt, flgs);
						if(type)
						{
							//Do we need to collect text?
							//INFO: We'll wait for a user input before we collect any data
							if(gl.isElmtCollectable(elmt))
							{
								//Make sure that text is not empty
								var txt = elmt.value;
								if(!this.isWhitespaceEmptyString(txt))
								{
									//Limit how many textboxes we can collect
									if(arrData.length >= this.gSettings.nCollectMax)
									{
										res = 0;
										break;
									}

									arrData.push({
										id: elmt.id,
										nm: elmt.name,
										tp: type,
										si: nSi1,
										val: txt
										});
								}
							}
						}
					}
				}
			}

			//Do we need to collect "contentEditable" elements?
			if(flgs & 0x2)			// 0x2 =		collect "contentEditable" html elements (and treat them as textarea in our "popup" window)
			{
				//Check for contentEditable elements (have to look through all elements)
				var objAll = document.getElementsByTagName("*");	//document.querySelectorAll('[contenteditable]');	//document.getElementsByTagName("*");
				if(objAll)
				{
					//var __s = "url=" + document.URL + "\n";
					//for(var i = 0; i < objAll.length; i++)
					//{
					//	__s += objAll[i].nodeName + ", ";
					//}
					//console.log(__s);

					var obj;
					var nSi2 = 0x20000;		//Value special for contentEditable elements
					for(var i = 0; i < objAll.length; i++, nSi2++)
					{
						obj = objAll[i];

						//if(obj.id == 'tinymce')
						//{
						//	var ffff = 1;
						//}

						//Check that this element has `contentEditable` property set
						if(obj.isContentEditable)
				//		if(obj.contentEditable &&
				//			obj.contentEditable != 'inherit' &&
				//			obj.contentEditable != 'false')
						{
							//Do we need to collect text?
							//INFO: We'll wait for a user input before we collect any data
							if(gl.isElmtCollectable(obj))
							{
								//Make sure that text is not empty
								var txt = obj.innerText;					//We need text only, no HTML or formatting
								if(!this.isWhitespaceEmptyString(txt))
								{
									//Limit how many textboxes we can collect
									if(arrData.length >= this.gSettings.nCollectMax)
									{
										res = 0;
										break;
									}

									arrData.push({
										id: obj.id,
										nm: obj.name,
										tp: ">ce",							//Special name -- used in other scripts as well!
										si: nSi2,
										val: txt
										});
								}
							}
						}
					}
				}
			}

		}
		catch(e)
		{
			//Exception
			res = -1;
			gl.logExceptionReport(100, e);
		}
		
		return {
			dt: arrData,
			rs: res
			};
	},
	

	isAutocompleteOff: function(elmt)
	{
		//RETURN:
		//		= 'true' if form 'elmt' has autocomplete turned off

		//Check the element itself
		var ac = elmt.autocomplete;
		if(ac)
		{
			if(ac.toLowerCase() == 'off')
				return true;
		}
	
		//Then try the form
		if(elmt.form)
		{
			ac = elmt.form.autocomplete;
			if(ac)
			{
				if(ac.toLowerCase() == 'off')
					return true;
			}
		}
	
		return false;
	},
	
	
	isElmtCollectable: function(elmt)
	{
		//Checks if the HTML element in 'elmt' is currently OK to collect data from
		//INFO: It first sets the event that listens for 'input' notifications and if any arrive then marks this element as collectable
		//INFO: We tested that 'input' event is sent in the following circumstances (for Chrome):
		//			- When user presses a key in the element that changes its text (arrow keys, shift, etc. don't count)
		//			- When user pastes text in the element
		//			- When user drags text in or out of the element
		//			- It works for <input>, <textarea> and contentEditable elements
		//			- It is NOT sent when the contents of the element are changed via JavaScript
		//RETURN:
		//		= 'true' if text from this element can be collected
		//		= 'false' if no need to collect it

		//Do we have our attribute set (if yes, then we can collect data on this element)
		if(elmt.__frmlzrColl92)
			return true;

		//Is listener set?
		if(!elmt.__frmlzrSet93)
		{
			//var __s = "inputSet: elmt=" + elmt.nodeName + ", id=" + elmt.id;
			//console.log(__s);

			//Add 'input' event listener
			elmt.addEventListener('input', gl._OnElmtInput, true);

			//elmt.addEventListener('keyup', gl._OnElmtKeyUp, true);

			//Apply attribute to the element that event was set
			elmt.__frmlzrSet93 = true;
		}

		return false;
	},

	_OnElmtInput: function(evt)
	{
		//Called when a text box receives any of the user input:
		//			- When user presses a key in the element that changes its text (arrow keys, shift, etc. don't count)
		//			- When user pastes text in the element
		//			- When user drags text in or out of the element
		//			- It works for <input>, <textarea> and contentEditable elements
		//			- It is NOT sent when the contents of the element are changed via JavaScript

		if(evt.target.__frmlzrColl92)
		{
			//This a precaution if 'removeEventListener' below fails
			//INFO: For some reason it may on some pages!
			return;
		}

		//Signal that we can collect data from this element
		evt.target.__frmlzrColl92 = true;

		//console.log("%%input%%%% id=" + elmt.target.id);

		//And remove 'input' listerner so that this method is no longer called (to save on CPU cycles)
		evt.target.removeEventListener('input', gl._OnElmtInput, true);

		//Send message to the background script to collect the data
		chrome.runtime.sendMessage({action: "reqUpdate01"});

	},

	//_OnElmtKeyUp: function(elmt)
	//{
	//	console.log("%%%key%%%");

	//	//And remove 'input' listerner so that this method is no longer called (to save on CPU cycles)
	////	elmt.target.removeEventListener('keyup', gl._OnElmtKeyUp, true);
	//},


	onDocumentChange: function(mutations)
	{
		//Called every time a change in the loaded document occurs
		//INFO: We need this to track immergence of new textboxes (say, created or inserted by a script)

		//INFO: This is a HIGH TRAFFIC method, so keep it simple!

		//console.log("%%mutation%%%%");

		var flgs = gl.gSettings.nCollectFlgs;

		//Check all reported mutations
		for(var m = 0; m < mutations.length; m++)
		{
			var objM = mutations[m];
			var elmtP = objM.target;

			//Check for <input> and <textarea> elements
			if(gl.isObjAcceptable(elmtP, flgs))
			{
				//Check if we have enabled tracking input from this element, and if not, enable it now
				gl.isElmtCollectable(elmtP);
			}
			else
			{
				//Check that this element has `contentEditable` property set
				if(elmtP.contentEditable &&
					elmtP.contentEditable != 'inherit' &&
					elmtP.contentEditable != 'false')
				{
					//Check if we have enabled tracking input from this element, and if not, enable it now
					gl.isElmtCollectable(elmtP);
				}
			}
			
			//Then check children elements inside this tag
			
			//Do we need any of these elements?
			// 0x4 =		collect input: text
			// 0x8 =		collect input: email
			// 0x10 =		collect input: number
			// 0x20 =		collect input: search
			// 0x40 =		collect input: tel
			// 0x80 =		collect input: url
			if(flgs & 0xfc)
			{
				//Check for input elements
				var frmTbx = elmtP.getElementsByTagName("input");
				if(frmTbx)
				{
					for(var i = 0; i < frmTbx.length; i++)
					{
						var elmt = frmTbx[i];
						if(gl.isObjAcceptable(elmt, flgs))
						{
							//Do we need to collect text? If so initiate 'input' event
							gl.isElmtCollectable(elmt);
						}
					}
				}
			}

			//Do we need textarea elements?
			if(flgs & 0x1)				// 0x1 =		collect textarea
			{
				//Check for textarea elements
				var frmTxa = elmtP.getElementsByTagName("textarea");
				if(frmTxa)
				{
					for(var i = 0; i < frmTxa.length; i++)
					{
						var elmt = frmTxa[i];

						//See if we need this element
						if(gl.isObjAcceptable(elmt, flgs))
						{
							//Do we need to collect text? If so initiate 'input' event
							gl.isElmtCollectable(elmt);
						}
					}
				}
			}
			
			//Do we need to collect "contentEditable" elements?
			if(flgs & 0x2)			// 0x2 =		collect "contentEditable" html elements (and treat them as textarea in our "popup" window)
			{
				//Check for contentEditable elements (have to look through all elements)
				var objAll = elmtP.getElementsByTagName("*");
				if(objAll)
				{
					var obj;
					for(var i = 0; i < objAll.length; i++)
					{
						obj = objAll[i];

						//Check that this element has `contentEditable` property set
						if(obj.isContentEditable)
						{
							//Do we need to collect text?
							//INFO: We'll wait for a user input before we collect any data
							gl.isElmtCollectable(obj);
						}
					}
				}
			}

		}
	},
	


	isObjAcceptable: function(obj, flgs)
	{
		//'flgs' = bitwise flags that specify which data to collect. Check background.js 'gSettings.nCollectFlgs' object props
		//RETURN:
		//		= type of 'obj' if acceptable for this app (always lower case and not ""), or
		//		= null if not
		var nRes = null;
		
		if(obj 
			&& (!(flgs & 0x10000) || obj.id || obj.name)		// 0x10000 =	if ID and NAME of html element must be defined for it to be collected
			)
		{
			//It must not be readonly
			if(obj.readOnly !== true)
			{
				//Check element tag
				if(obj.nodeName == "INPUT")
				{
					//Check types
					var type = obj.type;
					if(type)
					{
						//Convert it to lower case for later comparisons
						type = type.toLowerCase();

						// 0x4 =		collect input: text
						// 0x8 =		collect input: email
						// 0x10 =		collect input: number
						// 0x20 =		collect input: search
						// 0x40 =		collect input: tel
						// 0x80 =		collect input: url
					
						//Acceptable types
						if(((flgs & 0x4) && type == "text") ||
							((flgs & 0x8) && type == "email") ||
							((flgs & 0x10) && type == "number") ||
							((flgs & 0x20) && type == "search") ||
							((flgs & 0x40) && type == "tel") ||
							((flgs & 0x80) && type == "url") 
							//|| type == "password"
							)
						{
							//See if we need to check autocomplete option
							if((flgs & 0x20000) ||								// 0x20000 =	collect data from elements that are marked for "autocomplete off"
								!gl.isAutocompleteOff(obj))
							{
								//Single line textbox
								nRes = type;
							}
						}
					}
				}
				else if((flgs & 0x1) && obj.nodeName == "TEXTAREA")		// 0x1 =		collect textarea
				{
					//See if we need to check autocomplete option
					if((flgs & 0x20000) ||								// 0x20000 =	collect data from elements that are marked for "autocomplete off"
						!gl.isAutocompleteOff(obj))
					{
						//Multiline textbox
						nRes = "textarea";
					}
				}
			
	//			if(nRes)
	//			{
	//				//Check element visible
	//			}
			}
		}
		
		return nRes;
	},


	isWhitespaceEmptyString: function(str)
	{
		//RETURN:
		//		= 'true' if 'str' is empty string, null, undefined, or consists of white-spaces only
		return str ? !(/\S/.test(str)) : (str === "" || str === null || str === undefined);
	},

	


	fillAllFormData: function(data)
	{
		//Fill form data
		//'data' = object with data to fill:
		//				Keys = 		Frame URLs + frame indexes (or "." for the main page)
		//				Values = 	Array of objects for each textbox data with the following properties:
		//								'si'	[integer] Sequential integer/index for this textbox -- trying to make it unique for all checkboxes on this page
		//								'id'	[string] html ID of the element (can be 'null' or "" if no such)
		//								'nm'	[string] html Name of the element (can be 'null' or "" if no such)
		//								'tp'	[string] html type of the element, always lower-case (cannot be 'null' or "") -- example: "textbox", "search", "textarea", etc.
		//								'v'		[string] text for the element to fill with
		//RETURN:
		//		= true if no errors
		var res = false;

		try
		{
			//Is it an iframe?
			var bIFrame = window != window.top;

			//Get this Iframe URL
			var strFrmUrl;

			if(bIFrame)
			{
				//Add IFRAME index in case of an iframe
				strFrmUrl = gl.get_iframeIndex() + ">" + document.URL;				//If change the ">" make sure to change it in processFormData()
				strFrmUrl = strFrmUrl ? strFrmUrl.toString().toLowerCase() : "";
			}
			else
			{
				//Top page
				strFrmUrl = ".";
			}

			//Go through all requested frames
			for(var frmURL in data)
			{
				//Normalize both URLs
				var strReqFrmUrl = frmURL ? frmURL.toString().toLowerCase() : "";

				//Is it our page that we need to fill?
				if(strReqFrmUrl == strFrmUrl)
				{
					var arrData = data[frmURL];

					//Go through all textboxes
					for(var a = 0; a < arrData.length; a++)
					{
						var bMatch = false;
						var objData = arrData[a];

						//Check for input elements
						var frmTbx = document.getElementsByTagName("input");
						if(frmTbx)
						{
							var nSi0 = 0;		//Value special for <input> elements
							for(var i = 0; i < frmTbx.length; i++, nSi0++)
							{
								var elmt = frmTbx[i];

								//See if it matches
								if(nSi0 == objData.si &&
									this.isSameStrNoCase(elmt.id, objData.id) &&
									this.isSameStrNoCase(elmt.name, objData.nm) &&
									this.isSameStrNoCase(elmt.type, objData.tp))
								{
									//Match!
									bMatch = true;
									elmt.value = objData.v;

									break;
								}
							}
						}

						if(bMatch)
							continue;


						if(objData.tp == 'textarea')
						{
							//Check for textarea elements
							var frmTxa = document.getElementsByTagName("textarea");
							if(frmTxa)
							{
								var nSi1 = 0x10000;		//Value special for <textarea> elements
								for(var i = 0; i < frmTxa.length; i++, nSi1++)
								{
									var elmt = frmTxa[i];

									//See if it matches
									if(nSi1 == objData.si &&
										this.isSameStrNoCase(elmt.id, objData.id) &&
										this.isSameStrNoCase(elmt.name, objData.nm))
									{
										//Match!
										bMatch = true;
										elmt.value = objData.v;

										break;
									}
								}
							}
						}

						if(bMatch)
							continue;


						if(objData.tp == '>ce')
						{
							//Check for contentEditable elements (have to look through all elements)
							var objAll = document.getElementsByTagName("*");
							if(objAll)
							{
								var nSi2 = 0x20000;		//Value special for contentEditable elements
								for(var i = 0; i < objAll.length; i++, nSi2++)
								{
									var elmt = objAll[i];

									//Check that this element has `contentEditable` property set
									if(elmt.isContentEditable)
							//		if(elmt.contentEditable &&
							//			elmt.contentEditable != 'inherit' &&
							//			elmt.contentEditable != 'false')
									{
										//See if it matches
										if(nSi2 == objData.si &&
											this.isSameStrNoCase(elmt.id, objData.id) &&
											this.isSameStrNoCase(elmt.name, objData.nm))
										{
											//Match!
											elmt.innerText = objData.v;

											break;
										}
									}
								}
							}
						}



					}

				}
			}

			//All done
			res = true;
		}
		catch(e)
		{
			//Exception
			res = false;
			gl.logExceptionReport(119, e);
		}

		return res;
	},


	isSameStrNoCase: function(str1, str2)
	{
		//RETURN:
		//		= true if both strings are the same in case-insensitive way
		if(str1)
		{
			if(str2)
			{
				if(str1.substring)
				{
					if(str2.substring)
					{
						return str1.toLowerCase() == str2.toLowerCase();
					}
					else
					{
						return str1.toLowerCase() == str2.toString().toLowerCase();
					}
				}
				else
				{
					if(str2.substring)
					{
						return str1.toString().toLowerCase() == str2.toLowerCase();
					}
					else
					{
						return str1.toString().toLowerCase() == str2.toString().toLowerCase();
					}
				}
			}
		}
		else if(!str2)
		{
			//Same empty strings?
			if((str1 === '' || str1 === null || str1 === undefined) && 
				(str2 === '' || str2 === null || str2 === undefined))
			{
				return true;
			}
		}

		return false;
	},
	
	

	collectAllFormDataAndNotify: function(bSendBkgndMsg)
	{
		//Collect all forms data and notify background page
		//'bSendBkgndMsg' = 'false' not to pass collected data to background script, or (default) pass it
		var objRes = {};
		
		try
		{
			//Is it an incognito tab
			var bIncog = chrome.extension.inIncognitoContext ? true : false;

			//Get top document URL (that is the same for all IFRAMEs)
			//INFO: Since an update v.1.0.0.3 this variable is used only as a fallback, so there's no problem if we don't get it here!
			var strTopURL;

			//See if it's an IFRAME?
			var bIframe = window.self !== window.top;
			if(!bIframe)
			{
				try
				{
					//Non-IFRAME page should allow us to know this
					strTopURL = window.top.document.URL;
				}
				catch(e)
				{
					//Failed due to some reason -- then use the same fallback method (see explanation below)
					strTopURL = document.referrer;
				}
			}
			else
			{
				//INFO: Special processing in case of an IFRAME
				//      Otherwise if we call the line above it will throw an XSS exception.
				//WARNING: Using the 'referrer' property is not ideal. If the IFRAME allows
				//         its own navigation, it will point to the IFRAME's previous page
				//         and not the top page!
				strTopURL = document.referrer;
			}
			
			//See if we're allowed to collect anything
			var bYesCollect = gl.gSettings.bCollectData;
			if(bYesCollect && 
				!gl.gSettings.bIncogCollectData &&
				bIncog)
			{
				//Don't collect from Incognito
				bYesCollect = false;
			}
			
			var oRet;
			if(bYesCollect)
			{
				//Only if we got the top URL
				//INFO: Since an update v.1.0.0.3 this variable is used only as a fallback, so there's no problem if we don't get it here!
			//	if(strTopURL)
			//	{
					//Collect
					oRet = gl.collectAllFormData();
			//	}
			//	else
			//	{
					//Error
			//		oRet = {
			//			rs: -1,
			//			dt: []
			//		};
			//	}
			}
			else
			{
				//Not allowed to collect -- return "nothing"
				oRet = {
					rs: 1,
					dt: []
				};
			}

			//Is it an iframe
			var bIfrm = window != window.top;

			//Get ifram Index
			//INFO: We need this to distinguish between possible IFRAMEs with the same source URL on the same page
			var ifrmInd = "";
			if(bIfrm)
			{
				//Only for IFRAMEs -- get iframe's index (we need it for unique frame ID for data caching)
				ifrmInd = gl.get_iframeIndex();
			}

			objRes = {
				action: "update01",
				topURL: strTopURL,							//[Obsolete] Main page URL (same for all nested IFRAMEs) -- (it is used only as a fallback if tab.url is not available from the content page, see processFormDataWithTopURL() function)
				pageURL: document.URL,						//Page or IFRAME url
				pageTitle: document.title,					//Page title, can be "" too. Also is "" for an IFRAME
			//	cpyID: window.nCS_counter,					//ID or counter for the copy of content script (due to a bug there could be more than one copy if this app is reloaded)
				favIconURL: gl.getFavIconUrl(true),			//Absolute path to the page's favorite icon
				bIFrame: bIfrm,								//'true' if running from iFrame within page
				ifrmI: ifrmInd,								//Index of the IFRAME, or "" for main page (example: "2" or "0_4" for a nested IFRAME)
				incg: bIncog,								//'true' if data was collected from "incognito" tab
				colRes: oRet.rs,							//[Integer] One of the following for the result of data collection:
															//			 1 = if all available textboxes were collected
															//			 0 = if had to stop at 'nCollectMax' number textboxes but more were available
															//			 -1 = if error collecting
				formData: oRet.dt							//Collected data, see collectAllFormData() for details
				};

			//var frms = document.getElementsByTagName("iframe");
			//console.log("URL=" + (!objRes.bIFrame ? "*" : objRes.pageURL) + ", cntFrms=" + (frms ? frms.length : "?"));
			//console.log("URL=" + (!objRes.bIFrame ? "*" : objRes.pageURL) + ", cnt=" + oRet.dt.length);

			//var inn = gl.get_iframeIndex();
			//console.log("URL=" + (!objRes.bIFrame ? "*" : objRes.pageURL) + ", i=" + inn + ", cnt=" + oRet.dt.length);

			//if(objRes.bIFrame)
			//{
			//	//var ddd = document.documentElement.outerHTML;
			//	//console.log("URL=" + (!objRes.bIFrame ? "*" : objRes.pageURL) + ", all1=" + document.all.length + ", ln1=" + ddd.length + ", cnt=" + oRet.dt.length);
			//	console.log("URL=" + (!objRes.bIFrame ? "*" : objRes.pageURL) + ", ifID=" + frmID + ", cnt=" + oRet.dt.length);
			//}
			//else
			//{
			//	console.log("URL=" + (!objRes.bIFrame ? "*" : objRes.pageURL) + ", -----");
			//}
			
			
			if(bSendBkgndMsg !== false)
			{
				//Send message to background page to update icon
				chrome.runtime.sendMessage(objRes);
			}
		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(103, e);
		}
		
		return objRes;
	},
	
	
	getFavIconUrl: function(bOnlyAbsoluteUrl)
	{
		//RETURN:
		//		= URL of the page's favorite icon, or "" if none
		var url = "";
		
		var arrLnks = document.getElementsByTagName("link");
		for(var i = 0; i < arrLnks.length; i++)
		{
			var att = arrLnks[i].getAttribute("rel");
			if(att != null)
			{
				att = att.toLowerCase();
				if(att == "icon" ||
					att == "shortcut icon" ||
					att == "icon shortcut")
				{
					//Got it
					url = arrLnks[i].getAttribute("href");
					
					if(bOnlyAbsoluteUrl === true)
					{
						//Convert to absolute URL
						var a = document.createElement('a');
						a.href = url;
						url = a.href;
					}
					
					break;
				}
			}
		}

		//Here's how to get a fav icon
		//	https://groups.google.com/a/chromium.org/forum/#!topic/chromium-extensions/DONzstBAJeo
		
		return url;
	},
	
	

	onPageLoaded: function(evnt)
	{
		//Is called right after a new page is loaded up

		//Collect data from the form
		gl.collectAllFormDataAndNotify();

		//console.log("##### Page is loaded, URL=" + evnt.target.URL);
	},
	
	onBeforeSubmit: function(elmt)
	{
		//Is called before forms submission on this page
		//'elmt' = event pointer

		//Collect data from the form
		gl.collectAllFormDataAndNotify();

		//console.log("##### Form submitted, URL=" + elmt.target.action);
	},
	
	onBeforePageUnload: function(elmt)
	{
		//Is called before the page is closed or changed to another URL
		
		//Collect data from the form
		gl.collectAllFormDataAndNotify();

		//console.log("##### Page UN-loaded, URL=" + elmt.target.URL);
	},
	
	onClickOnPage: function(elmt)
	{
		//Click anywhere on page
		//'elmt' = element that was clicked
		
		//Collect data from the form
		gl.collectAllFormDataAndNotify();

		//console.log("##### Click on page: " + elmt.target.nodeName);
	},

	onKeyPressOnPage: function(elmt)
	{
		//Key pressed on page
		//'elmt' = element that the key was pressed in

		//We need to process only Enters
		if(elmt.keyCode == 13)
		{
			//Collect data from the form
			gl.collectAllFormDataAndNotify();

			//console.log("##### Key/Enter pressed on page: " + elmt.target.nodeName);
		}
	},



	addRemPageEventHandlers: function(bRemoveOnly)
	{
		//Add/remove all necessary event handlers for this page
		//'bRemoveOnly' = set to true to remove listeners instead of setting them

		try
		{
			//For event names for addEventListener() check:
			//		https://developer.mozilla.org/en-US/docs/Web/Events
			
			//OnLoad - when page fully loads
		//	window.onload = gl.onPageLoaded;
			//document.addEventListener('DOMContentLoaded', gl.onPageLoaded, true);		//Doen't seem to work????

			//OnSubmit - before any form on page is submitted
			var frms = window.document.getElementsByTagName("form");
			if(frms)
			{
				for(var i = 0; i < frms.length; i++)
				{
					if(!bRemoveOnly)
					{
						//Handle the capturing phase of an event by setting last param to 'true'
						//INFO: This will make sure that it is processed before other page events
						frms[i].addEventListener('submit', gl.onBeforeSubmit, true);
					}
					else
					{
						//Remove existing event
						frms[i].removeEventListener('submit', gl.onBeforeSubmit, true);
					}
				}
			}

			//OnBeforeUnload - before page is closed or unloaded
			if(!bRemoveOnly)
			{
				//Handle the capturing phase of an event by setting last param to 'true'
				//INFO: This will make sure that it is processed before other page events
				window.addEventListener('beforeunload', gl.onBeforePageUnload, true);
				//window.onbeforeunload = gl.onBeforePageUnload;
			}
			else
			{
				//Remove existing event
				window.removeEventListener('beforeunload', gl.onBeforePageUnload, true);
			}
			
			//INFO: At this point, for some reason, `document.body` may be null
			//      Wait for it to initialize if it is...
			gl._addBodyEventHandlers(0, bRemoveOnly);


		}
		catch(e)
		{
			//Exception
			gl.logExceptionReport(bRemoveOnly ? 111 : 166, e);
		}
	},


	_addBodyEventHandlers: function(itr, bRemoveOnly)
	{
		//Try to add <body> notifications
		//'itr' = iteration that this method was called
		//'bRemoveOnly' = set to true to remove listeners instead of setting them

		//Don't go too long
		if(itr >= 2000)		//Will amount to about ~10 sec
		{
			//Quit trying
			var msg = "[151] Quit trying to " + (!bRemoveOnly ? "install" : "remove") + " document.body handlers. Iteration=" + itr;
			gl.logDebuggerMsg(msg);
			console.error(msg);

			return;
		}

		//Do we have 'body' loaded?
		var bdy = window.document.body;
		if(bdy)
		{
			//OnClick - anywhere on the page
			if(!bRemoveOnly)
			{
				//INFO: We need to check AJAX form submissions and save fields before they go out
				//Handle the capturing phase of an event by setting last param to 'true'
				//INFO: This will make sure that it is processed before other page events
				bdy.addEventListener('click', gl.onClickOnPage, true);
			}
			else
			{
				//Remove existint
				bdy.removeEventListener('click', gl.onClickOnPage, true);
			}
			
			//OnKeyUp - anywhere on the page
			if(!bRemoveOnly)
			{
				//INFO: We need to check for Enter key presses to check AJAX form submissions and save fields before they go out
				//Handle the capturing phase of an event by setting last param to 'true'
				//INFO: This will make sure that it is processed before other page events
				bdy.addEventListener('keydown', gl.onKeyPressOnPage, true);
			}
			else
			{
				//Remove existing
				bdy.removeEventListener('keydown', gl.onKeyPressOnPage, true);
			}

			//No need to try again
			return;
		}

		//Try it again in 1ms
		window.setTimeout(function()
		{
			//Call our method again
			gl._addBodyEventHandlers(itr + 1, bRemoveOnly);
		},
		1);		//1ms
	},


	updateSettings: function(dta)
	{
		//Set settings values
		//'dta' = object with settings data received from the background.js. For details see 'gl.getSettingsForContent()' there
		
		gl.gSettings = {
			nCollectFlgs: dta.nCollectFlgs,
			nCollectMax: dta.nCollectMax,
			bCollectData: dta.bCollectData,
			bIncogCollectData: dta.bIncogCollectData
		};
	},



	onMessageProc: function(request, sender, sendResponse)
	{
		//Processes messages sent from the background.js
		if(request.action == "update02")
		{
			//Do we need to return result?
			var bReturnRes = request.retRes;

			//Update settings values with the new ones sent by the background.js
			gl.updateSettings(request.sttgs);
			
			//Need to update
			var objRes = gl.collectAllFormDataAndNotify(bReturnRes ? false : true);
			
			//Send response that we've done it
			sendResponse({
				res: 535,									//Special success code
				resData: (bReturnRes ? objRes : null)
				});
		}
		else if(request.action == "fill01")
		{
			//Fill form controls with data provided
			//		= true if no errors
			var bRes = gl.fillAllFormData(request.data);

			//Send response back
			sendResponse({
				res: bRes
				});
		}
		else
		{
			//Message is not processed here
			if(sendResponse)
				sendResponse(null);
		}

		//return true;		//Needed to indicate async response: http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
	},



	logDebuggerMsg: function(message)
	{
		//Send message to be displayed in the debugger console
		console.error("[159] cpyID=" + window.nCS_counter + ", CS ERR: " + message);
	},
	
	
	
	
	logExceptionReport: function(specErr, err)
	{
		//Log exception into debugger console
		var __s = "ERROR(" + specErr + "): ";
		
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
		
		gl.logDebuggerMsg(__s);
	},

	_remElementInputListener: function(elmt)
	{
		//Remove 'input' event listener from the 'elmt'
		if(elmt)
		{
			//Remove listener if it's there
			elmt.removeEventListener('input', gl._OnElmtInput, true);

			//And remove our property flags
			delete elmt.__frmlzrColl92;
			delete elmt.__frmlzrSet93;
		}
	},

	get_iframeIndex: function()
	{
		//RETURN:
		//		= "" for top window
		//	 	= IFrame zero-based index with nesting, example: "2", or "0_4"
		//		= "?" if error
		return gl._iframeIndex_recurs(window); 	// Assume self by default
	},

	_iframeIndex_recurs: function(wnd)
	{
		//DO NOT call directly
		var resInd = "";

		var wndTop = window.top;

		if(wnd == wndTop)
			return resInd;

		var wndPar = wnd.parent;

		if(wndPar != wndTop)
		{
			resInd = this._iframeIndex_recurs(wndPar) + "_";
		}

		var frmsPar = wndPar.frames;
		for(var i = 0; i < frmsPar.length; i++)
		{
			if(frmsPar[i] == wnd)
				return resInd + i;
    		}

		return resInd + "?";
	},


	updateFromBgnd: function(iter)
	{
		//Called to connect to the background script
		//INFO: May be called repeatedly if background script has not set up message listeners yet!
		//'iter' = [0 and up) iteration at which this method was called

		//Get settings values from the background page first
		chrome.runtime.sendMessage({action: "update00"}, function(response)
		{
			//Any error?
			var rspErr = chrome.runtime.lastError;

			//Process the response
			if(/*!rspErr &&*/ 
				response &&
				response.res === 99)			//Special response value
			{
				//Success!

				//Set settings values
				gl.updateSettings(response.dta);

			}
			else
			{
				//Failed to process

				//See if we're over the limit
				if(iter > 100)
				{
					////Give up
					//gl.logDebuggerMsg("[113] Failed to init content page: '" + (document ? document.URL : "?") + 
					//	"', cnt=" + iter + ", err=" + (rspErr ? rspErr.message : "-") + ", resp.res=" + (response ? response.res : "-"));
				}
				else
				{
					//Try again after a pause
					window.setTimeout(function(nI)
					{
						//Call again
						gl.updateFromBgnd(++nI);
					},
					10,				//10 ms delay
					iter);
				}
			}

		});
	},



	removeAllElementInputListeners: function()
	{
		//Remove all 'input' event listeners on the page

		var frmTbx = document.getElementsByTagName("input");
		if(frmTbx)
		{
			for(var i = 0; i < frmTbx.length; i++)
			{
				gl._remElementInputListener(frmTbx[i]);
			}
		}

		var frmTxa = document.getElementsByTagName("textarea");
		if(frmTxa)
		{
			for(var i = 0; i < frmTxa.length; i++)
			{
				gl._remElementInputListener(frmTxa[i]);
			}
		}

		var objAll = document.getElementsByTagName("*");
		if(objAll)
		{
			var obj;
			for(var i = 0; i < objAll.length; i++)
			{
				obj = objAll[i];

				//Check that this element has `contentEditable` property set
				if(obj.isContentEditable)
				{
					gl._remElementInputListener(obj);
				}
			}
		}

	},
	
	
	allDestructor: function()
	{
		//Unloads previously loaded DOM

		//Remove unique iframe ID (which will prevent this page from collecting data & sending it to the background script)
		//gl.giFrameID = null;

		//Count how many copies of the content script are running
		window.nCS_counter = window.nCS_counter ? window.nCS_counter + 1 : 1;
	//	console.log("[165] Destructor called. copyID=" + window.nCS_counter);

		//Remove event handlers from the page
		gl.addRemPageEventHandlers(true);

		//Remove changes observer
		if(window.__ftmlzr_mutObs)
		{
			//Remove it
			window.__ftmlzr_mutObs.disconnect();
			delete window.__ftmlzr_mutObs;

			//console.log("[167] Observer removed. copyID=" + window.nCS_counter);
		}

		//Remove message listener from background.js
	//	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){});

		//Remove 'input' listeners from the elements
		gl.removeAllElementInputListeners();


		//And finally remove this event
		document.removeEventListener('destructor_evt_' + chrome.runtime.id, gl.allDestructor);
	}
	
};



//Unload previous DOM events & stop timers first
//INFO: This is needed in case the app is restarted manually from settings or upon update
//      In that case the content.js gets orphaned, where APIs start to fail and on top of that
//      it can no longer send message to the background.js.
//      To remedy this is to remove all events, timers, etc. from the content.js and let it unload
//		For details check:
//			http://stackoverflow.com/q/25840674/843732
//		and also:
//			https://code.google.com/p/chromium/issues/detail?id=414213

var destructionEvent = 'destructor_evt_' + chrome.runtime.id;		//Use this app ID
document.dispatchEvent(new CustomEvent(destructionEvent));			//Is called only if it was set before
document.addEventListener(destructionEvent, gl.allDestructor);

//Create unique IFrame ID
//gl.giFrameID = (new Date()).getTime() + '_' + Math.random();


//INFO: Inject content script ONLY when page loads!
//window.onload = function()
//{
	//Begin trying to connect to the background.js to update local settings data from it
	//INFO: We need to do this to prevent a possible race-condition when this content script loads up to this point but
	//      the background.js is not yet ready to process messages.... in other words we can't wait for it here!
	gl.updateFromBgnd(0);


	//Add event handlers to this page
	gl.addRemPageEventHandlers();

	//Add mutations observer (it will tell us if there were any changes to the page after it was loaded)
	var mutObs = new MutationObserver(gl.onDocumentChange);
	mutObs.observe(document, {
		//attributes: true,
		childList: true,
		subtree:true
	});

	//Remember observer in the global window var
	window.__ftmlzr_mutObs = mutObs;

	//When page loads, try to collect form data
	gl.collectAllFormDataAndNotify();


	//Set to process messages from the background script
	chrome.runtime.onMessage.addListener(gl.onMessageProc);


//};



