// Popup page JavaScript functions

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
gl = 
{
    oAccPages: {},      //[Object] Accordion pages:
	                    //			  Keys =	[Integer] Page ID
	                    //			  Value =	Object with the following properties:
						//						 'avl' =   'true' if Accordion page is available
                        //                       'url' =   Page URL that can be used as the key in 'oStorage' in background page
                        //                       'tms' =   Array with timing ticks for saved data, sorted in descending order (from latest to oldest). Index in this array = range slider index
						//						 'tbxs' =  Array with textboxes as they are presented to the user (and sorted by date of saving, with last being on top)
						//									Each element is an object that has the following props:
						//										'tbxID'	= Textbox special ID
						//										'tbx'	= object with data (textbox)
						//										'tm'	= Lastest save time for the textbox in ticks

	gbIncogTab: false,			//true if the popup window was loaded from the "Incognito" tab
	gbShiftOn: false,			//true if SHIFT key is currently pressed
	gstrActvURL: "",			//URL that was active when popup window was opened
	gnTabID: null,				//TabID that the popup window was opened from, or null


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

    encodeHtml: function(txt)
    {
        //Encode 'txt' to be placed into HTML attribute
        //RETURN:
        //      = Encoded string

        // http://stackoverflow.com/questions/18749591/encode-html-entities-in-javascript

        return txt.replace(/\"|\&|\n|\r|[\u00A0-\u9999<>\&]/gim, function(o) {
            return '&#' + o.charCodeAt(0) + ';';
        });
    },

    abbrevString: function(str, nMaxLen)
    {
        //Abbreviate 'str' if it's longer than 'nMaxLen' chars in length
        //INFO: If abbreviated, will have "..." added at the end
        //RETURN:
        //      = Abbreviated string, or original one
        str = str ? str.toString() : "";
        if(nMaxLen >= 3 &&
            str.length > nMaxLen - 3)
        {
            str = str.substr(0, nMaxLen - 3) + "...";
        }

        return str;
    },


    getAccordionHtml: function(urlActive, bFromIncog, nViewIncog)
    {
		//'urlActive' = URL for the active page
		//'bFromIncog' = true if called from the "Incognito" tab
		//'nViewIncog' = How to view mixed data from "Incognito" and regular tabs:
		//					0 = allow viewing mixed data
		//					1 = allow to view mixed data only in Incognito mode
		//					2 = do not allow viewing mixed data
        //RETURN: Object with the following properties:
		//			'htm' =	 Accordion's html markup:
        //          			Html for the <div></div> "accordion" JQuery control, or
        //         				"" if no data collected yet
		//			'actv' = index of the active tab, or false if none
        var html = "";

        //Get storage object
		//INFO: Make sure to get a copy of the memory object, as the actual storage object may change while the popup window is shown!
		//      Also make the copy only ONCE by employing the "singleton" in the next method
        var oStorage = this.getCopyMemoryStorageObject();

        //Clear the cache data
        for (var m in this.oAccPages)
        {
            delete this.oAccPages[m];
        }

		//Normalize
		bFromIncog = bFromIncog ? true : false;

		//Format active URL (make it all lower case)
		var nActvInd = false;
		urlActive = urlActive ? urlActive.toString().toLowerCase() : "";
		
        //Make an array
        var arrPgs = [];
        for(var pageUrl in oStorage)
        {
            arrPgs.push({
                pgUrl: pageUrl,
                tm: oStorage[pageUrl].tm   //[Integer] UTC time when page was last saved, expressed as an integer of milliseconds since midnight of January 1, 1970
            });
        }

        //Sort array by time in descending order
        arrPgs.sort(function(a, b){
            //1:    if 'a' is greater than 'b'
            //-1:   if 'a' is less than 'b'
            //0:    if 'a' is equal to 'b'
            return b.tm - a.tm;
        });


        if(arrPgs.length > 0)
        {
            //Get translations
            var strPromptOpenPageHtml = this.encodeHtml(chrome.i18n.getMessage("prompt_OpenPage"));

            //var strAppel_Less = this.encodeHtml(chrome.i18n.getMessage("slider_latest"));
            //var strAppel_More = this.encodeHtml(chrome.i18n.getMessage("slider_oldest"));
            //var strAppel_Copy = this.encodeHtml(chrome.i18n.getMessage("lnk_copy"));
            //var strAppel_FormFill = this.encodeHtml(chrome.i18n.getMessage("lnk_form_fill"));
            //var strAppel_CopyAll = this.encodeHtml(chrome.i18n.getMessage("lnk_copy_all"));
            //var strAppel_RemPg = this.encodeHtml(chrome.i18n.getMessage("lnk_remove_page"));
            //var strAppel_Saved = this.encodeHtml(chrome.i18n.getMessage("msg_saved"));
            //var strAppel_Incog = this.encodeHtml(chrome.i18n.getMessage("msg_incognito"));
            //var strAppel_MoreDataAvl = this.encodeHtml(chrome.i18n.getMessage("msg_more_txbxs_available"));
            //var strPromptMoreDataAvl = this.encodeHtml(chrome.i18n.getMessage("prompt_more_txbxs_available"));


            //Begin making the "accordion" for all pages
            for(var p = 0; p < arrPgs.length; p++)
            {
                var pgUrl = arrPgs[p].pgUrl;
                var objPg = oStorage[pgUrl];

				//See if this page was saved from "Incognito" tab
				var bIncog = objPg.flg & 0x2 ? true : false;				//0x2 =	set if page data came from "Incognito" tab

				//See if we can view this page?
				//					0 = allow viewing mixed data
				//					1 = allow to view mixed data only in Incognito mode
				//					2 = do not allow viewing mixed data
				if(nViewIncog == 1)
				{
					//1 = allow to view mixed data only in Incognito mode
					if(!bFromIncog && bIncog)
						continue;
				}
				else if(nViewIncog == 2)
				{
					//2 = do not allow viewing mixed data
					if(bFromIncog != bIncog)
						continue;
				}

                //Make page ID for elements
                var pgId = p.toString();        //Must be an integer converted to string!
				
				//See if we need to make this page active
				if(nActvInd === false)
				{
					if(urlActive == pgUrl.toLowerCase())
					{
						//Make active page (where accordion will be open)
						nActvInd = p;
					}
				}

                //Make favorites icon
				var urlFavIcn = objPg.fav ? objPg.fav : 'chrome://favicon/' + pgUrl;
                html += '<h3 pgId="' + pgId + '"' +
					(bIncog ? ' class="hdrAccrdIncg"' : '') +
					'><img src="' + this.encodeHtml(urlFavIcn) + '" draggable="false" class="favIcn" />';

                //Make document title
                var strTitle = objPg.ttl;
                if(!strTitle)
                    strTitle = pgUrl;

                //Make short title
                var strTitleShort = gl.abbrevString(strTitle, 128);		//We'll be also using CSS to display only certain width of text

                //Make accordion item caption
                html += '<div class="divTrunc"><span class="hdrPageTitle" title="' + this.encodeHtml(strTitle) + '">' +
                    this.encodeHtml(strTitleShort) +
                    "</span></div>";

                //Add accordion caption link
				var strPgUrlSafe = this.encodeHtml(pgUrl);
                html += '<a class="hdrLink" draggable="false" href="' + strPgUrlSafe + 
                    '" title="' + /*strPromptOpenPageHtml + ': ' +*/ strPgUrlSafe + 
                    '" target="_blank"></a>';

                //End accordion caption
                html += '</h3>';

				//Make empty panel
				//INFO: We need this to make Accordion open "gracefully"
				html += '<div></div>';

                //Add this page to the global cache array
                this.oAccPages[pgId] = {
					avl: false,				//Accordion page is not available yet
                    url: pgUrl,             //Page URL
                    tms: null				//Timing array is null at this point (it will be loaded up when page is opened)
                };

            }
        }

        return {
			htm: html,
			actv: nActvInd
		};
    },


	onOpenAccordionPage: function(bCreated, objHdr, objPanel)
	{
		//Called before Accordion page is displayed
		//'bCreated' = true if opening accordion page when the Accordion itself was just created (and we're opening the current page)
		//'objHdr' = header of the panel that is being open
		//'objPanel' = panel that is being open

		try
		{
			//Get page id
			var pgId = objHdr.getAttribute('pgId');

			var objAccPg = this.oAccPages[pgId];
			if(objAccPg)
			{
				//Only if not previously done
				if(!objAccPg.avl)
				{
					//Get page URL
					var pgUrl = objAccPg.url;

					//gl.logReport("tab " + (bCreated ? "created" : "opened") + " pgId=" + pgId + ", id=" + objHdr.id + ", panel=" + objPanel.id);

					//Get storage object
					//INFO: Make sure to get a copy of the memory object, as the actual storage object may change while the popup window is shown!
					//      Also make the copy only ONCE by employing the "singleton" in the next method
					var oStorage = this.getCopyMemoryStorageObject();

					//Preload string
					var strAppel_Less = this.encodeHtml(chrome.i18n.getMessage("slider_latest"));
					var strAppel_More = this.encodeHtml(chrome.i18n.getMessage("slider_oldest"));
					var strAppel_Copy = this.encodeHtml(chrome.i18n.getMessage("lnk_copy"));
					var strAppel_FormFill = this.encodeHtml(chrome.i18n.getMessage("lnk_form_fill"));
					var strAppel_CopyAll = this.encodeHtml(chrome.i18n.getMessage("lnk_copy_all"));
					var strAppel_RemPg = this.encodeHtml(chrome.i18n.getMessage("lnk_remove_page"));
					var strAppel_Saved = this.encodeHtml(chrome.i18n.getMessage("msg_saved"));
					var strAppel_Incog = this.encodeHtml(chrome.i18n.getMessage("msg_incognito"));
					var strAppel_MoreDataAvl = this.encodeHtml(chrome.i18n.getMessage("msg_more_txbxs_available"));
					var strPromptMoreDataAvl = this.encodeHtml(chrome.i18n.getMessage("prompt_more_txbxs_available"));


					//Get page data object
					var objPg = oStorage[pgUrl];
					var objFrms = objPg.frms;

					//See if this page was saved from "Incognito" tab
					var bIncog = objPg.flg & 0x2 ? true : false;				//0x2 =	set if page data came from "Incognito" tab

					//Make html for the page
					var html = "";


					//Do we have a timing array in global cache?
					var arrTms = objAccPg.tms;
					if(!arrTms)
					{
						//Make array of saved form times
						arrTms = [];

						//Also look for the latest time
						var tmDefLtst = 0;

						//Go through all iframes for this page
						for(var frmUrl in objFrms)
						{
							for(var tbxId in objFrms[frmUrl])
							{
								var arrTxs = objFrms[frmUrl][tbxId].tx;

								//Only if not a single saved entry
								if(arrTxs.length > 1)
								{
									for(var i = 0; i < arrTxs.length; i++)
									{
										//Do we have this time already?
										if(arrTms.indexOf(arrTxs[i].tm) == -1)
										{
											//Need to add it
											arrTms.push(arrTxs[i].tm);
										}
									}
								}
								else
								{
									//Check for latest time
									if(arrTxs.length > 0)
									{
										if(arrTxs[0].tm > tmDefLtst)
											tmDefLtst = arrTxs[0].tm;
									}
								}
							}
						}

						//Did we get anything?
						if(arrTms.length == 0)
						{
							//Add a single entry
							arrTms.push(tmDefLtst);

							if(!tmDefLtst)
							{
								//Error
								console.error("[318] Failed to find def_tm");
							}
						}

						//Sort array by time in descending order
						arrTms.sort(function(a, b){
							//1:    if 'a' is greater than 'b'
							//-1:   if 'a' is less than 'b'
							//0:    if 'a' is equal to 'b'
							return b - a;
						});

						//Update timing array in global cache array
						objAccPg.tms = arrTms;
					}


					//Only if we have time collected
					if(arrTms.length > 0)
					{
						//Create an array with textboxes (and sort it by date of saving, with last being on top)
						//Each element is an object that has the following props:
						//		'tbxID'	= Textbox special ID
						//		'tbx'	= object with data (textbox)
						//		'tm'	= Lastest save time for the textbox in ticks
						var arrTbxs = objAccPg.tbxs;

						if(!arrTbxs)
						{
							//Create array
							arrTbxs = [];

							//Go through all iframes
							for(var frmUrl in objFrms)
							{
								//Go through all texboxes in this iframe
								for(var tbxId in objFrms[frmUrl])
								{
									var objTbx = objFrms[frmUrl][tbxId];
							
									//Get array with textbox saved data
									var arr_tx = objTbx.tx;
										
									//Pick the latest save time for this textbox (or the largest value)
									var tmLatest = arr_tx.length > 0 ? arr_tx[0].tm : 0;
									for(var y = 1; y < arr_tx.length; y++)
									{
										if(arr_tx[y].tm > tmLatest)
											tmLatest = arr_tx[y].tm;
									}

									//Add it
									arrTbxs.push({
										tm: tmLatest,		//Lastest save time for the textbox in ticks
										tbxID: tbxId,		//Textbox special ID
										tbxGInd: gl.__gnTbxGIndCntr++,			//Textbox global index that is incremented for each new textbox (this is needed to prevent textboxes with repeating IDs)
										tbx: objTbx			//object with data (textbox)
									});
								}
							}

							//Sort array in desending order by last time of saving textboxes
							arrTbxs.sort(function(a, b){
								//1:    if 'a' is greater than 'b'
								//-1:   if 'a' is less than 'b'
								//0:    if 'a' is equal to 'b'
								return b.tm - a.tm;
							});

							//Remember it									
							objAccPg.tbxs = arrTbxs;
						}


						//Only if we've got any textboxes to show
						if(arrTbxs.length > 0)
						{
							//Contents of a single accordion item
							html += '<div><div class="mainDiv">';
					
							//Incognito?
							if(bIncog)
							{
								html += '<span class="spnTopIncg">' + strAppel_Incog + '</span>'
							}

							//Last saved
							html += '<span class="spnTopLstSvd">' + strAppel_Saved + ' ' + 
								this.formatDateTimeFromTicks(this.convertFromUTCTicks(objPg.tm)) + '</span>';

							html += '<div class="divTop">';

							//Make top range slider
							html += '<div class="divTopSldr">';

							//Enabled slider?
							var strSliderDsbld = arrTms.length > 1 ? "" : " disabled";

							//"Latest" button
							html += '<input type="button" id="idBtnLess_' + pgId + '" class="btnLess" value="&lt;"' + strSliderDsbld + ' />';

							//Range slider
							html += '<input type="range" id="idRange_' + pgId + '" class="ctrlRange" min="0" value="0" max="' + (arrTms.length - 1) + '" step="1"' + strSliderDsbld + ' />';

							//"Oldest" button
							html += '<input type="button" id="idBtnMore_' + pgId + '" class="btnMore" value="&gt;"' + strSliderDsbld + ' />';

							//Appellations
							html += '<div class="brk"></div><span class="lblLatest">' + 
								strAppel_Less +
								'</span><span class="lblOldest">' +
								strAppel_More +
								'</span></div>';

							//Add small toolbar buttons
							html += '<div class="divTopTb">';

							//Form Fill button
							html += '<a href="#" id="idFormFill_' + pgId + '" draggable="false" class="smtbBtnFill smtbBtn" title="' + strAppel_FormFill + '"></a>';

							//Copy All button
							html += '<a href="#" id="idCopyAll_' + pgId + '" draggable="false" class="smtbBtnCopy smtbBtn" title="' + strAppel_CopyAll + '"></a>';

							//Remove Page button
							html += '<a href="#" id="idRemPg_' + pgId + '" draggable="false" class="smtbBtnRem smtbBtn" title="' + strAppel_RemPg + '"></a>';

							html += '</div>';

							html += '</div>';


							//Go through all textboxes
							for(var t = 0; t < arrTbxs.length; t++)
							{
								var tbxId = arrTbxs[t].tbxID;
								var objTbx = arrTbxs[t].tbx;
								var nGInd = arrTbxs[t].tbxGInd;

								//Make html safe textbox ID (with sequential ID)
								var safeTbxId = this.encodeHtml(tbxId + objTbx.si.toString() + nGInd.toString());

								//Begin DIV
								html += '<div class="ctrlDiv">';

								//Control name
								var ctrlNm = objTbx.nm;
								if(!ctrlNm)
									ctrlNm = objTbx.id;
								//if(!ctrlNm)
								//    ctrlNm = ":";

								html += '<span class="ctrlName">' + this.encodeHtml(this.abbrevString(ctrlNm, 64)) + '</span>';

								////Get first suitable text & time (start with index 0)
								//var txt = null;
								//var tm = 0;
								//for(var i = 0; i < arrTms.length; i++)
								//{
								//	tm = arrTms[i];
								//	txt = this._getTextForTm(objTbx.tx, tm);
								//	if(txt)
								//		break;
								//}

								//Get first suitable text & time (start with index 0)
								var oTxtTm = gl._lookupBestMatchTxTm(0, arrTms, objTbx.tx);
								var txt = oTxtTm ? oTxtTm.txt : null;
								var tm = oTxtTm && oTxtTm.tm ? oTxtTm.tm : 0;

								//Make text HTML safe
								var safeText = txt ? this.encodeHtml(txt) : "";

								//Then go by type
								if(!this.isLikeTextarea(objTbx.tp))
								{
									//Single line
									html += '<input type="text" id="idTbx_' + pgId + '_' + safeTbxId + '" value="' + safeText + '" readonly />';
								}
								else
								{
									//Multiline control
									html += '<textarea id="idTA_' + pgId + '_' + safeTbxId + '" rows="4" readonly>' + safeText + '</textarea>';
								}

								//Copy link
								html += '<a href="#" draggable="false" class="lnkCopy" id="idCopy_' + pgId + '_' + safeTbxId + '">' + strAppel_Copy + '</a>';

								//Time saved
								html += '<span class="ctrlSaved" id="idTmSvd_' + pgId + '_' + safeTbxId + '">' + strAppel_Saved + ' ' +
									this.formatDateTimeFromTicks(this.convertFromUTCTicks(tm)) + '</span>';

								//End DIV
								html += '</div>';
							}


							//Did we have more data available flag?
							if(objPg.flg & 0x1)
							{
								//Add info
								html += '<div class="ctrlDivMoreAvl"><a class="ctrlMoreAvlSttgsLnk" href="#" title="' + 
									strPromptMoreDataAvl +
									'">' +
									strAppel_MoreDataAvl +
									'</a></div>';
							}

							html += '</div></div>';
						}
						else
						{
							//Error - no textboxes to show
							gl.logError("[255] ERR:TxBxs, url=" + pgUrl)

							//Show error for the user -- "Error displaying contents..."
							html = '<p style="color: red;">' + this.encodeHtml(chrome.i18n.getMessage("msg_err_contents01")) + '</p>';
						}
					}
					else
					{
						//Error - could not get times!
						gl.logError("[243] ERR:Times, url=" + pgUrl)

						//Show error for the user -- "Error displaying contents..."
						html = '<p style="color: red;">' + this.encodeHtml(chrome.i18n.getMessage("msg_err_contents01")) + '</p>';
					}

					//Add display
					objPanel.innerHTML = html;

					//Add event handlers for the page
					gl.addAccordionEventHandlersForPage(pgId);

					//Set flag that we've filled this panel out (so that it's not redone again)
					objAccPg.avl = true;
				}
			}
			else
			{
				//Error
				gl.logError("[242] ERROR: Tab " + (bCreated ? "created" : "opened") + " pgId=" + pgId + ", id=" + objHdr.id + ", panel=" + objPanel.id);
			}
		}
		catch(e)
		{
            //Exception
            gl.logExceptionReport(241, e);
		}
	},
	__gnTbxGIndCntr: 0,				//[Internal] Global texbox index, constantly incremented


	onCloseAccordionPage: function(objHdr, objPanel)
	{
		//Called after Accordion page is closed
		//'objHdr' = header of the panel that was closed
		//'objPanel' = panel that was closed

		//Get page id
		var pgId = objHdr.getAttribute('pgId');

		//gl.logReport("tab closed pgId=" + pgId + ", id=" + objHdr.id + ", panel=" + objPanel.id);


		//Reset panel to default html (we need this for Accordion to work)
		//objPanel.innerHTML = "<div></div>";		//Don't delete it -- a user may adjust text box height before closing it, so let them keep it until popup is closed!
	},



    updateAccordionCtrls: function(pageID, nIndexTime)
    {
        //Update accordion controls for 'pageID' for 'nIndexTime'
        //'pageID' = [Integer] Accordion page ID (which is the key in 'oAccPages' object)
        //'nIndexTime' = [Integer] Position of the timing slider: [0 and up)
        try
        {
            var objAccPg = this.oAccPages[pageID];
            if(objAccPg)
            {
				nIndexTime = parseInt(nIndexTime, 10);

                var arrTms = objAccPg.tms;
                if(nIndexTime >= 0 &&
                    nIndexTime < arrTms.length)
                {
                    //Get storage object
					//INFO: Make sure to get a copy of the memory object, as the actual storage object may change while the popup window is shown!
					//      Also make the copy only ONCE by employing the "singleton" in the next method
                    var oStorage = this.getCopyMemoryStorageObject();

		            var strAppel_Saved = this.encodeHtml(chrome.i18n.getMessage("msg_saved"));

					var objPage = oStorage[objAccPg.url];
					if(objPage)
					{
						//Each element is an object that has the following props:
						//		'tbxID'	= Textbox special ID
						//		'tbx'	= object with data (textbox)
						//		'tm'	= Lastest save time for the textbox in ticks
						var arrTbxs = objAccPg.tbxs;

						//Go through all textboxes
						for(var t = 0; t < arrTbxs.length; t++)
						{
							var tbxId = arrTbxs[t].tbxID;
							var objTbx = arrTbxs[t].tbx;
							var nGInd = arrTbxs[t].tbxGInd;

							//Make html safe textbox ID (with sequential ID)
							var safeTbxId = this.encodeHtml(tbxId + objTbx.si.toString() + nGInd.toString());

							//Get textbox object
							var textBxID = (!this.isLikeTextarea(objTbx.tp) ? 'idTbx_' : 'idTA_') + pageID + '_' + safeTbxId;
							var textBx = document.getElementById(textBxID);
							if(textBx)
							{
								//Look up data by time
								var oTxtTm = this._lookupBestMatchTxTm(nIndexTime, arrTms, objTbx.tx);

								//Did we get it?
								textBx.value = oTxtTm.txt ? oTxtTm.txt : "";

								//Control for when saved
								var spnSvd = document.getElementById('idTmSvd_' + pageID + '_' + safeTbxId);
								if(spnSvd)
								{
									//Set new date/time when saved
									spnSvd.innerText = strAppel_Saved + ' ' + 
										(oTxtTm.tm !== null ? this.formatDateTimeFromTicks(this.convertFromUTCTicks(oTxtTm.tm)) : "");
								}
							}
							else
							{
								console.error("[315] Bad pageID=" + pageID + ", tp=" + objTbx.tp);
							}
						}




						////Go through all iframes on this page
						//for(var frmUrl in objPage.frms)
						//{
						//	//Go through all texboxes in this iframe
						//	for(var tbxId in objPage.frms[frmUrl])
						//	{
						//		var objTbx = objPage.frms[frmUrl][tbxId];

						//		//Make html safe textbox ID (with sequential ID)
						//		var safeTbxId = this.encodeHtml(tbxId + objTbx.si.toString());

						//		//Get textbox object
						//		var textBxID = (!this.isLikeTextarea(objTbx.tp) ? 'idTbx_' : 'idTA_') + pageID + '_' + safeTbxId;
						//		var textBx = document.getElementById(textBxID);
						//		if(textBx)
						//		{
						//			//Look up data by time
						//			var oTxtTm = this._lookupBestMatchTxTm(nIndexTime, arrTms, objTbx.tx);

						//			//Did we get it?
						//			textBx.value = oTxtTm.txt ? oTxtTm.txt : "";

						//			//Control for when saved
						//			var spnSvd = document.getElementById('idTmSvd_' + pageID + '_' + safeTbxId);
						//			if(spnSvd)
						//			{
						//				//Set new date/time when saved
						//				spnSvd.innerText = strAppel_Saved + ' ' + 
						//					(oTxtTm.tm !== null ? this.formatDateTimeFromTicks(this.convertFromUTCTicks(oTxtTm.tm)) : "");
						//			}
						//		}
						//		else
						//		{
						//			console.error("[315] Bad pageID=" + pageID + ", tp=" + objTbx.tp);
						//		}
						//	}
						//}
					}
                }
            }
        }
        catch(e)
        {
            //Exception
            gl.logExceptionReport(110, e);
        }
    },


	isLikeTextarea: function(type)
	{
		//RETURN: 'true' if 'type' should be treated as textarea or multilined element
		return type == "textarea" || type == ">ce";
	},



	addToolbarEventHandlers: function()
	{
		//Add event handlers for main toolbar controls on top of the popup window

		//Add onclick events for ON/OFF button
		document.getElementById('tbBtnOnOff').onclick = function (evt) 
		{
			if(!evt.shiftKey)
			{
				//Toggle data collection on/off
				gl.onOff();
			}
			else
			{
				//See if we're allowed to collect data
				var stngs = gl.getSettingsRef();

				var bCollect = stngs.bCollectData;
				if(bCollect &&
					gl.gbIncogTab && 
					!stngs.bIncogCollectData)
				{
					bCollect = false;
				}

				//Only if data collection is enabled?
				if(bCollect)
				{
					//Only if page data was collected for this tab
					//		= true if data was collected for the tab
					//		= false if data was not collected
					//		= null if error (such as no tab)
					var resTA = gl.isTabDataCollected();
					if(resTA === true)
					{
						//Toggle exception for the current page
						if(!gl.isCmdOrCtrlKey(evt))
						{
							//Shift+click
							gl.toggleException(gl.gstrActvURL, 0, true);		//Site exception
						}
						else
						{
							//Ctrl+Shift+Click
							gl.toggleException(gl.gstrActvURL, 1, true);		//Site exception
						}
					}
					else
					{
						//Can't do it
						return false;
					}
				}
				else
				{
					//Don't do anything
					return false;
				}
			}

			//And close popup window
			window.close();

			//Return false to prevent <a> element effects
			return false;
		};

		document.getElementById('tbBtnSettings').onclick = function (evt) 
		{
			//Show settings
			if(!evt.shiftKey)
			{
				//Regular click
				gl.showOptions();
			}
			else
			{
				//Shift-click

				//Show Exceptions
				gl.showOptions("tabExceptions");
			}

			//Return false to prevent <a> element effects
			return false;
		};

		document.getElementById('tbBtnInfo').onclick = function (evt) 
		{
			//Information button
			if(!evt.shiftKey)
			{
				//Regular click
				gl.showInfoWindow(true);
			}
			else
			{
				//Shift-click -- show bug report
				gl.showInfoWindow(true, "tabFeedback");
			}

			//Return false to prevent <a> element effects
			return false;
		}


	},

	isCmdOrCtrlKey: function(evt)
	{
		//RETURN:
		//			= true if 'evt' has Command key (on a Mac) or Ctrl key (on Windows) pressed down
		return evt.metaKey || evt.ctrlKey ? true : false;
	},


	getLastVisitedURL: function()
	{
		//RETURN:
		//		= Last visited URL, or
		//		= "" if none or not known
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.getLastVisitedURL();
	},



    addPageEventHandlers: function()
    {
		//Add event handlers for page controls (except Accordion)

		//Detect resize events on pop-up
		//INFO: We need this primarily if the page is zoomed up or down
		//      In this case we need to close the pop-up
		$(window).resize(function()
		{
			//Get page zoom (will be 1.0 for 100%)
			var zoom = gl.getPageZoom();

			//Multiply it by 100 and convert to int
			var iZoom = zoom * 100;
			iZoom = ~~iZoom;

			//Did we check the zoom before?
			if(window.__formlzr_izoom &&
				iZoom != window.__formlzr_izoom)
			{
				//Close popup
				console.log("[208] Automatically closing popup after detecting zooming. Zoom before=" + window.__formlzr_izoom + ", zoom now=" + iZoom);

				window.close();
			}

			//Remember zoom used
			window.__formlzr_izoom = iZoom;
		});

	},


    addAccordionEventHandlersForPage: function(pgID)
    {
		//Add event handlers for Accordion controls in the page
		//INFO: We have to do it here because Chrome does not allow inline scripts to use onClick='' inclusions!
		//'pgID' = page ID from 'oAccPages' object that is used as a property

		//Get storage object
		//INFO: Make sure to get a copy of the memory object, as the actual storage object may change while the popup window is shown!
		//      Also make the copy only ONCE by employing the "singleton" in the next method
		var oStorage = this.getCopyMemoryStorageObject();

		//Get "Less" buttons
		var btnLess = document.getElementById("idBtnLess_" + pgID);
		if(btnLess)
		{
			btnLess.frmlzr_pgID = pgID;

			btnLess.addEventListener("click", function(e){ gl.onSliderBtnLess(e.target.frmlzr_pgID); });
		}

		//Get "More" buttons
		var btnMore = document.getElementById("idBtnMore_" + pgID);
		if(btnMore)
		{
			btnMore.frmlzr_pgID = pgID;

			btnMore.addEventListener("click", function(e){ gl.onSliderBtnMore(e.target.frmlzr_pgID); });
		}

		//Get Range slider
		var sliderID = "idRange_" + pgID;
		var slider = document.getElementById(sliderID);
		if(slider)
		{
			slider.frmlzr_pgID = pgID;
			slider.frmlzr_sliderID = sliderID;

			slider.addEventListener("input", function(e){ 
				var t = e.target;
				gl.onSliderPosChanged(t.frmlzr_pgID, t.frmlzr_sliderID);
			});
		}

		//Add page small toolbar button handlers
		var tbBtnFill_ID = "idFormFill_" + pgID;
		var tbBtnFill = document.getElementById(tbBtnFill_ID);
		if(tbBtnFill)
		{
			tbBtnFill.frmlzr_pgID = pgID;

			tbBtnFill.addEventListener("click", function(e)
			{
				gl.onPageTbButton_FormFill(e.target.frmlzr_pgID, e); 

				//Prevent link to be followed (which may lead to undesirable behavior)
				e.preventDefault();
				return false;
			});
		}

		//Copy All handler
		var tbBtnCopyAll_ID = "idCopyAll_" + pgID;
		var tbBtnCopyAll = document.getElementById(tbBtnCopyAll_ID);
		if(tbBtnCopyAll)
		{
			tbBtnCopyAll.frmlzr_pgID = pgID;

			tbBtnCopyAll.addEventListener("click", function(e)
			{
				gl.onPageTbButton_CopyAll(e.target.frmlzr_pgID, e); 

				//Prevent link to be followed (which may lead to undesirable behavior)
				e.preventDefault();
				return false;
			});
		}

		//Remove page button handler
		var tbBtnRemPg_ID = "idRemPg_" + pgID;
		var tbBtnRemPg = document.getElementById(tbBtnRemPg_ID);
		if(tbBtnRemPg)
		{
			tbBtnRemPg.frmlzr_pgID = pgID;

			tbBtnRemPg.addEventListener("click", function(e)
			{
				gl.onPageTbButton_RemovePage(e.target.frmlzr_pgID, e); 

				//Prevent link to be followed (which may lead to undesirable behavior)
				e.preventDefault();
				return false;
			});
		}


		//Add copy link events
        var objAccPg = this.oAccPages[pgID];
		var objPage = oStorage[objAccPg.url];
		if(objPage)
		{
			//Each element is an object that has the following props:
			//		'tbxID'	= Textbox special ID
			//		'tbx'	= object with data (textbox)
			//		'tm'	= Lastest save time for the textbox in ticks
			var arrTbxs = objAccPg.tbxs;

			//Go through all textboxes
			for(var t = 0; t < arrTbxs.length; t++)
			{
				var tbxId = arrTbxs[t].tbxID;
				var objTbx = arrTbxs[t].tbx;
				var nGInd = arrTbxs[t].tbxGInd;

				//Make html safe textbox ID (with sequential ID)
				var safeTbxId = this.encodeHtml(tbxId + objTbx.si.toString() + nGInd.toString());

				var lnkID = "idCopy_" + pgID + '_' + safeTbxId;
				var lnkCopy = document.getElementById(lnkID);
				if(lnkCopy)
				{
					//Make textbox ID
					var textBxID = (!this.isLikeTextarea(objTbx.tp) ? 'idTbx_' : 'idTA_') + pgID + '_' + safeTbxId;
					var textBx = document.getElementById(textBxID);
					if(textBx)
					{
						lnkCopy.frmlzr_pgID = pgID;
						lnkCopy.frmlzr_lnkID = lnkID;
						lnkCopy.frmlzr_textBxID = textBxID;
						lnkCopy.frmlzr_tp = lnkID;  //objTbx.tp;

						lnkCopy.addEventListener("click", function(e){
							t = e.target;
							gl.onItemCopyClicked(t.frmlzr_pgID, t.frmlzr_lnkID, t.frmlzr_textBxID, t.frmlzr_tp);

							//Prevent link to be followed (which may lead to the page being scrolled to the top)
							e.preventDefault();
							return false;
						});
					}
					else
					{
						//Error
						console.error("[317] Bad textBxID=" + textBxID);
					}
				}
				else
				{
					//Error
					console.error("[316] Bad copy link, lnkID=" + lnkID);
				}
			}




			////Go through all iframes on this page
			//for(var frmUrl in objPage.frms)
			//{
			//	//Go through all texboxes in this iframe
			//	for(var tbxId in objPage.frms[frmUrl])
			//	{
			//		var objTbx = objPage.frms[frmUrl][tbxId];

			//		//Make html safe textbox ID (with sequential ID)
			//		var safeTbxId = this.encodeHtml(tbxId + objTbx.si.toString());

			//		var lnkID = "idCopy_" + pgID + '_' + safeTbxId;
			//		var lnkCopy = document.getElementById(lnkID);
			//		if(lnkCopy)
			//		{
			//			//Make textbox ID
			//			var textBxID = (!this.isLikeTextarea(objTbx.tp) ? 'idTbx_' : 'idTA_') + pgID + '_' + safeTbxId;
			//			var textBx = document.getElementById(textBxID);
			//			if(textBx)
			//			{
			//				lnkCopy.frmlzr_pgID = pgID;
			//				lnkCopy.frmlzr_lnkID = lnkID;
			//				lnkCopy.frmlzr_textBxID = textBxID;
			//				lnkCopy.frmlzr_tp = lnkID;  //objTbx.tp;

			//				lnkCopy.addEventListener("click", function(e){
			//					t = e.target;
			//					gl.onItemCopyClicked(t.frmlzr_pgID, t.frmlzr_lnkID, t.frmlzr_textBxID, t.frmlzr_tp);

			//					//Prevent link to be followed (which may lead to the page being scrolled to the top)
			//					e.preventDefault();
			//					return false;
			//				});
			//			}
			//		}
			//	}
			//}
		}


		//Add "Settings" link to "More data available" links in Accordion, if present
		$(".ctrlMoreAvlSttgsLnk").click(function(evt)
		{
			evt.preventDefault();

			//Show settings ("Memory" tab)
			gl.showOptions("tabMemory");
		});


    },


    onSliderBtnLess: function(pageID)
    {
        //Called when a range slider's "<" button is clicked
        //'pageID' = [Integer] Accordion page ID (which is the key in 'oAccPages' object)

        //console.log("Less button, page=" + pageID + ", URL=" + this.oAccPages[pageID].url);

		//Locate the slider ctrl
        var objSlider = document.getElementById("idRange_" + pageID);
        if(objSlider)
		{
			//Get current pos
			var nPos = objSlider.value;

			//Go to next one
			if(nPos > 0)
				nPos--;
			else
				nPos = 0;

			if(nPos >= 0)
			{
				//Update slider
				objSlider.value = nPos;

				//And update controls
				this.updateAccordionCtrls(pageID, nPos);
			}
		}
    },

    onSliderBtnMore: function(pageID)
    {
        //Called when a range slider's ">" button is clicked
        //'pageID' = [Integer] Accordion page ID (which is the key in 'oAccPages' object)

        //console.log("More button, page=" + pageID + ", URL=" + this.oAccPages[pageID].url);

		//Locate the slider ctrl
        var objSlider = document.getElementById("idRange_" + pageID);
        if(objSlider)
		{
			//Get current pos
			var nPos = objSlider.value;

            var objAccPg = this.oAccPages[pageID];

			//Go to next one
			if(nPos < objAccPg.tms.length)
				nPos++;
			else
				nPos = objAccPg.tms.length - 1;

			if(nPos >= 0)
			{
				//Update slider
				objSlider.value = nPos;

				//And update controls
				this.updateAccordionCtrls(pageID, nPos);
			}
		}
    },

    onSliderPosChanged: function(pageID, sliderID)
    {
        //Called when a range slider position changes while a user draggs it
        //'pageID' = [Integer] Accordion page ID (which is the key in 'oAccPages' object)
        //'sliderID' = slider ID that calls this

        //Get slider
        var objSlider = document.getElementById(sliderID);
        if(objSlider)
        {
            //Get position
            var nPos = objSlider.value;

            //console.log("Slider, page=" + pageID + ", pos=" + nPos);

			this.updateAccordionCtrls(pageID, nPos);
        }
    },

	onPageTbButton_CopyAll: function(pageID, event)
	{
        //Called when a page small toolbar "Copy All" button is clicked
        //'pageID' = [Integer] Accordion page ID (which is the key in 'oAccPages' object)
		//'event' = event that was raised
		var str = "";

         try
        {
            var objAccPg = this.oAccPages[pageID];
            if(objAccPg)
            {
			   //Get storage object
				//INFO: Make sure to get a copy of the memory object, as the actual storage object may change while the popup window is shown!
				//      Also make the copy only ONCE by employing the "singleton" in the next method
				var oStorage = this.getCopyMemoryStorageObject();

				//Look up our page
				var objPage = oStorage[objAccPg.url];
				if(objPage)
				{
					//Get type of newlines to use
					var strNL = this.getNewLine();

					//Check for "Shift" key
					var bAdvanced = !!event.shiftKey;

					//Localized strings
					var strAppel_Saved = chrome.i18n.getMessage("msg_saved");
					var strAppel_MoreDataAvl = chrome.i18n.getMessage("msg_more_txbxs_available");


					//Page title
					if(objPage.ttl)
						str += '"' + objPage.ttl + '"' + strNL;

					//Page URL
					if(objAccPg.url)
						str += objAccPg.url + strNL;

					//FavIcon
					if(bAdvanced)
					{
						if(objPage.fav)
							str += "FavIcon: " + objPage.fav + strNL;

						str += "Flgs: 0x" + objPage.flg.toString(16) + strNL;
					}

					//Saved:
					str += strAppel_Saved + ' ' + (objPage.tm !== null ? this.formatDateTimeFromTicks(this.convertFromUTCTicks(objPage.tm)) : "") + strNL;

					str += strNL;


					//Locate the slider ctrl
					var objSlider = document.getElementById("idRange_" + pageID);
					if(objSlider)
					{
						//Get current slider pos as selected time index
						var nIndexTime = parseInt(objSlider.value, 10);

						var arrTms = objAccPg.tms;
						if(arrTms &&
							nIndexTime >= 0 &&
							nIndexTime < arrTms.length)
						{
							//We collect data differently for "Advanced"
							if(!bAdvanced)
							{
								//Get previously collected data
								var arrTbxs = objAccPg.tbxs;
								if(arrTbxs &&
									arrTbxs.length > 0)
								{
									//Go through all textboxes (they are already sorted in correct order)
									for(var t = 0; t < arrTbxs.length; t++)
									{
										var objTbx = arrTbxs[t].tbx;

										//Look up data by time
										var oTxtTm = this._lookupBestMatchTxTm(nIndexTime, arrTms, objTbx.tx);

										str += '-------------------------------' + strNL;

										//Name of textbox
										var ctrlNm = objTbx.nm;
										if(!ctrlNm)
											ctrlNm = objTbx.id;

										if(ctrlNm)
											str += '[' + ctrlNm + ']' + strNL;

										//Date when saved
										str += strAppel_Saved + ' ' + (oTxtTm.tm !== null ? this.formatDateTimeFromTicks(this.convertFromUTCTicks(oTxtTm.tm)) : "") + strNL;

										str += strNL;

										//Did we get text? (If so, convert with required new-lines)
										str += oTxtTm.txt ? this.replaceNewLines(oTxtTm.txt) : "";
										str += strNL + strNL;

									}
								}
							}
							else
							{
								//Advanced collection

								//Go through all iframes on this page
								for(var frmUrl in objPage.frms)
								{
									//Parse URL
									//			'url'	= URL
									//			'idx'	= Index of the IFRAME, or "" for main page (example: "2" or "0_4" for a nested IFRAME)
									var oIf = gl.extractIframeInfo(frmUrl);

									//Set frame URL
									str += '+++++++++++++++++++++++++++++++' + strNL;

									str += 'IFrame: ' + oIf.url + strNL;

									if(oIf.idx)
									{
										//Add Iframe Index
										str += 'IIndex: ' + oIf.idx + strNL;
									}

									str += strNL;


									//Go through all texboxes in this iframe
									for(var tbxId in objPage.frms[frmUrl])
									{
										var objTbx = objPage.frms[frmUrl][tbxId];

										//Look up data by time
										var oTxtTm = this._lookupBestMatchTxTm(nIndexTime, arrTms, objTbx.tx);

										str += '-------------------------------' + strNL;

										//Advanced
										str += 'ID: "' + (objTbx.id ? objTbx.id : "") + '"' + strNL;
										str += 'Name: "' + (objTbx.nm ? objTbx.nm : "") + '"' + strNL;
										str += 'TbxId: "' + tbxId + '"' + strNL;
										str += 'Type: "' + (objTbx.tp ? objTbx.tp : "") + '"' + strNL;
										str += 'OSI: 0x' + objTbx.osi.toString(16) + strNL;
										str += 'SI: 0x' + objTbx.si.toString(16) + strNL;

										//Date when saved
										str += strAppel_Saved + ' ' + (oTxtTm.tm !== null ? this.formatDateTimeFromTicks(this.convertFromUTCTicks(oTxtTm.tm)) : "") + strNL;

										str += strNL;

										//Did we get text? (If so, convert with required new-lines)
										str += oTxtTm.txt ? this.replaceNewLines(oTxtTm.txt) : "";
										str += strNL + strNL;

									}
								}

							}


							//Do we have more data available?
							if(objPage.flg & 0x1)
							{
								str += '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' + strNL;
								str += strAppel_MoreDataAvl + strNL;
							}


							//Copy data (don't substite line-feeds
							if(this.clipboardCopyText(str, false))
							{
								//Done
								//console.log("Success: Copy all, pageID=" + pageID + ", Advanced=" + bAdvanced);
							}

						}
					}
				}
			}
		}
		catch(e)
		{
			//Exception
            gl.logExceptionReport(114, e);
		}
	},


	onPageTbButton_FormFill: function(pageID, event)
	{
        //Called when a page small toolbar "Form Fill" button is clicked
        //'pageID' = [Integer] Accordion page ID (which is the key in 'oAccPages' object)
		//'event' = event that was raised
		var str = "";

         try
        {
			//First update data in the current page (since we'll be overwriting it here!)
			var bgPage = chrome.extension.getBackgroundPage();
			bgPage.gl.updateInfoFromActiveTab(function()
			{
				//Only after page data is updated

				var objAccPg = gl.oAccPages[pageID];
				if(objAccPg)
				{
				   //Get storage object
					//INFO: Make sure to get a copy of the memory object, as the actual storage object may change while the popup window is shown!
					//      Also make the copy only ONCE by employing the "singleton" in the next method
					var oStorage = gl.getCopyMemoryStorageObject();

					//Look up our page
					var objPage = oStorage[objAccPg.url];
					if(objPage)
					{

						//Locate the slider ctrl
						var objSlider = document.getElementById("idRange_" + pageID);
						if(objSlider)
						{
							//Get current slider pos as selected time index
							var nIndexTime = parseInt(objSlider.value, 10);

							var arrTms = objAccPg.tms;
							if(nIndexTime >= 0 &&
								nIndexTime < arrTms.length)
							{

								//Begin filling object with data to fill
								var data = {};

								//Go through all iframes on this page
								for(var frmUrl in objPage.frms)
								{
									var arrData;

									//Do we have this frame?
									if(!(frmUrl in data))
									{
										//Add it anew
										arrData = [];
										data[frmUrl] = arrData;
									}
									else
									{
										//Already have it
										arrData = data[frmUrl];
									}

									//Go through all texboxes in this iframe
									for(var tbxId in objPage.frms[frmUrl])
									{
										var objTbx = objPage.frms[frmUrl][tbxId];

										//Look up data by time
										var oTxtTm = gl._lookupBestMatchTxTm(nIndexTime, arrTms, objTbx.tx);

										//Add new textbox
										//								'si'	[integer] Sequential integer/index for this textbox -- trying to make it unique for all checkboxes on this page
										//								'id'	[string] html ID of the element (can be 'null' or "" if no such)
										//								'nm'	[string] html Name of the element (can be 'null' or "" if no such)
										//								'tp'	[string] html type of the element, always lower-case (cannot be 'null' or "") -- example: "textbox", "search", "textarea", etc.
										//								'v'		[string] text for the element to fill with
										arrData.push({
											si: objTbx.osi,									//[Integer] -- use original value
											id: objTbx.id ? objTbx.id.toString() : "",		//Convert to [string]!
											nm: objTbx.nm ? objTbx.nm.toString() : "",		//Convert to [string]!
											tp: objTbx.tp ? objTbx.tp.toString() : "",		//Convert to [string]!
											v: oTxtTm.txt ? oTxtTm.txt.toString() : ""		//Convert to [string]!
										});


									}

								}


								//Now we can send a message to the content script to do the filling (it will be done by the background page)
								bgPage.gl.fillAllFormData(data);

							}
						}
					}
				}

			});
		}
		catch(e)
		{
			//Exception
            gl.logExceptionReport(122, e);
		}
	},



	onPageTbButton_RemovePage: function(pageID, event)
	{
        //Called when a page small toolbar "Remove Page" button is clicked
        //'pageID' = [Integer] Accordion page ID (which is the key in 'oAccPages' object)
		//'event' = event that was raised

		gl.showModalPrompt_OKCancel(chrome.i18n.getMessage("msg_pg_remove"), 
			chrome.i18n.getMessage("msg_title_pg_remove"), 
			chrome.i18n.getMessage("btn_remove"), 
			chrome.i18n.getMessage("btn_cancel"),
			this.onRemovePagaData, 
			{
				pageID: pageID,
				event: event
			});
	},

	onRemovePagaData: function(data)
	{
		//Remove page data -- callback method when user chose to "Remove page data"
		//INFO: DO NOT CALL directly. Use onPageTbButton_RemovePage() instead!
        //'data.pageID' = [Integer] Accordion page ID (which is the key in 'oAccPages' object)
		//'data.event' = event that was raised

		try
		{
			//Get page ID
			var pageID = data.pageID;

			//console.log("Removing page=" + pageID);

            var objAccPg = gl.oAccPages[pageID];
            if(objAccPg)
            {
			   //Get reference to storage object
				//INFO: It is important to get the "Reference" and not the copy because we'll be removing from it!
				var oStorage = gl.getMemoryStorageObjectRef();

				//Look up our page
				if(objAccPg.url in oStorage)
				{
					//Remove the current accordion
					$('#accordion').accordion('destroy');

					//Delete the object from the storage array
					delete oStorage[objAccPg.url];

					//And also remove page from 'objAccPg'
					delete gl.oAccPages[pageID];

					//Set the cache for the copy of storage as cleared so that it is renewed next time
					//INFO: Also update persistent storage with new data...
					gl.resetCopyMemoryStorageObject(true);


					//And rebuild the accordion (do not select anything in it)
					gl.createAccordion("");


					//Send message to the Options window to update, if it's shown
					gl.updateOptionsPage();

				}
			}
		}
		catch(e)
		{
			//Exception
            gl.logExceptionReport(118, e);
		}
	},

    onItemCopyClicked: function(pageID, linkID, tbxID, typeTbx)
    {
        //Called when "Copy" link is clicked for a textbox item
        //'pageID' = [Integer] Accordion page ID (which is the key in 'oAccPages' object)
        //'linkID' = link ID that was clicked
        //'tbxID' = textbox ID that this link belongs to
        //'typeTbx' = lower-case type of textbox, example: "textbox", "search", "textarea", etc.

        //Get textbox
        var objTbx = document.getElementById(tbxID);
        if(objTbx)
        {
            //Copy to clipboard (substitute line-feeds)
            if(this.clipboardCopyText(objTbx.value, true))
            {
                //console.log("Copied: " + objTbx.value);

                //Animate the link itself to show user that it was copied
                var objLink = document.getElementById(linkID);
                if(objLink)
                {
                    objLink.innerText = gl.encodeHtml(chrome.i18n.getMessage("lnk_done"));

                    setTimeout(function(){
                        objLink.innerText = gl.encodeHtml(chrome.i18n.getMessage("lnk_copy"));
                    }, 900);
                }
            }
        }
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

	logExceptionReport: function(specErr, err)
    {
        //Log exception through the background page
        var bgPage = chrome.extension.getBackgroundPage();
        bgPage.gl.logExceptionReport(specErr, err);
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


	_lookupBestMatchTxTm: function(nIndexTime, arrTms, arrTx)
	{
		//Look up best matching textbox text and time by 'nIndexTime' in 'arrTms' array
		//'arrTms' = array with save time/ticks for all textboxes on page, sorted from latest to oldest (used as index of position for the Range slider)
		//'arrTx' = Object with textboxes text and when it was saved (equal to 'gl.oStorage[page].frms[frame][textbox].tx')
		//RETURN:
		//		= Object with data located

		//Look up data by time
		var txt = null;
		var tm = null;
		//for(var t = nIndexTime; t >= 0; t--)		//(go back if exact match is not found)
		for(var t = nIndexTime; t < arrTms.length; t++)		//Look forward
		{
			txt = this._getTextForTm(arrTx, arrTms[t]);
			if(txt)
			{
				//Got something
				tm = arrTms[t];
				break;
			}
		}

		//Nothing?
		if(!txt)
		{
			//for(var t = nIndexTime + 1; t < arrTms.length; t++)		//Look forward
			for(var t = nIndexTime - 1; t >= 0; t--)		//(go back if exact match is not found)
			{
				txt = this._getTextForTm(arrTx, arrTms[t]);
				if(txt)
				{
					//Got something
					tm = arrTms[t];
					break;
				}
			}
		}

		//Still nothing?
		if(!txt)
		{
			//The array must have only one value at this point!
			if(arrTx.length > 0)
			{
				txt = arrTx[0].v;
				tm = arrTx[0].tm;
			}

			//Check that it's only one element!
			if(arrTx.length != 1)
			{
				//Error
				console.error("[319] Bad index, nIndexTime=" + nIndexTime + ", arrTms_Len=" + arrTms.length + ", arrTx_Len=" + arrTx.length);
			}
		}

		return {
			txt: txt,
			tm: tm
		};
	},

    _getTextForTm: function(arr, tm)
    {
        //RETURN:
        //      = Text for 'tm' in 'arr', or
        //      = null if no such
        for(var i = 0; i < arr.length; i++)
        {
            if(arr[i].tm == tm)
                return arr[i].v;
        }

        return null;
    },

	getSettingsRef: function()
	{
		//RETURN: Reference to settings object, see 'gl.gSettings' in background.js
        var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.gSettings;
	},


	getPlatformType: function()
	{
		//RETURN:
		//		= Platform type that this app is running on. One of:
 		//			= 0 if other platform
		//			= 1 if running on OS X
		//			= 2 if running on Windows
		//			= 3 if running on Linux
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.gPlatform;
	},

	isTabDataCollected: function(nTabID)
	{
		//'nTabID' = tab ID to check, or if omitted use the current tab
		//RETURN:
		//		= true if data was collected for the tab
		//		= false if data was not collected
		//		= null if error (such as no tab)
		var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.isTabDataCollected(nTabID !== null && nTabID !== undefined ? nTabID : gl.gnTabID);
	},


	getNewLine: function()
	{
		//RETURN:
		//		= New-line chars requested in the Settings

		//	0 =		No conversion
		//	1 =		Use Windows newlines: \r\n
		//	2 =		Use OS X/Linux/Unix newlines: \n
		//	3 =		Use Apple II/OS-9 style newlines: \r
		var nSubst = this.getSettingsRef().nCopySubstNewLines;

        if(nSubst == 1)
        {
			//Use windows newlines
            return "\r\n";
        }
		else if(nSubst == 2)
		{
			//Use Unix newlines
            return "\n";
		}
		else if(nSubst == 3)
		{
			//Use Apple II newlines
            return "\r";
		}

		//Use depending on the machine we're running on
 		//			= 0 if other platform
		//			= 1 if running on OS X
		//			= 2 if running on Windows
		//			= 3 if running on Linux
		switch(this.getPlatformType())
		{
			case 1:
			case 3:
				return "\n";		//Use OS X/Linux/Unix newlines: \n
			case 2:
				return "\r\n";		//Use Windows newlines: \r\n
		}

		//Default
		return "\n";
	},


	replaceNewLines: function(str)
	{
		//Substitute new-lines in 'str' with OS specific ones, according to user selection
        var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.replaceNewLines(str);
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
					gl.logExceptionReport(312, e);
				}
            };

            document.execCommand("Copy", false, null);
            document.oncopy = undefined;

            return res;
        }
        catch(e)
        {
            //Exception
            gl.logExceptionReport(109, e);

            return false;
        }
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

    formatDateFromTicks: function(nTicks)
    {
	    //'nTicks' = number of milliseconds since midnight of January 1, 1970
	    //RETURN:
	    //		= Formatted date
	    return new Date(nTicks).toLocaleDateString();
    },

    formatTimeFromTicks: function(nTicks)
    {
	    //'nTicks' = number of milliseconds since midnight of January 1, 1970
	    //RETURN:
	    //		= Formatted time
	    return new Date(nTicks).toLocaleTimeString();
    },

    getMemoryStorageObjectRef: function()
    {
        //RETURN:
        //      = Reference to the storage object from the background page
        var bgPage = chrome.extension.getBackgroundPage();
		return bgPage.gl.oStorage;
    },

	__gcpyMemStg: null,							//DO NOT use directly!!!
    getCopyMemoryStorageObject: function()
    {
        //RETURN:
        //      = "Deep" copy of the storage object from the background page
		if(!this.__gcpyMemStg)
		{
			//Make a deep copy only once!
			var bgPage = chrome.extension.getBackgroundPage();
			this.__gcpyMemStg = $.extend(true, {}, bgPage.gl.oStorage);
		}

		return this.__gcpyMemStg;
	},

	resetCopyMemoryStorageObject: function(bUpdatePersistStorage)
	{
		//Reset the singleton used in 'getCopyMemoryStorageObject' function
		//INFO: Must be called event time the storage object from the background page is altered!
		//'bUpdatePersistStorage' = true to update persistent storage
		this.__gcpyMemStg = null;

		if(bUpdatePersistStorage)
		{
			//Update persistent storage (do it always)
			var bgPage = chrome.extension.getBackgroundPage();
			bgPage.gl.onPersistentSaveStorage(true);
		}
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


	createAccordion: function(tabUrl)
	{
		//Add "Accordion" control to the popup window
		//'tabUrl' = Get currently active URL to display in Accordion, or "" not to open anything

		var bIncognito = gl.gbIncogTab;		//true if creating an "Accordion" from an "Incognito" tab

		//Get settings object
		var stngs = gl.getSettingsRef();

		//Make "accordion" html and apply it
		var objAcc = document.getElementById("accordion");
		var objAccDta = gl.getAccordionHtml(tabUrl, bIncognito, stngs.nViewIncogData);
		if(!(objAcc.innerHTML = objAccDta.htm))
		{
			//There's no data collected yet
			document.getElementById("mainSection").innerHTML = '<span class="spnNoData">' + gl.encodeHtml(chrome.i18n.getMessage("msg_no_data")) + '</span>';
		}
	
		//Add event handlers for the accordion
		//gl.addAccordionEventHandlers();
	
	
		//Disable animation in case of Mac OS X due to a nasty Accordion/Chrome popup bug:
		//	http://stackoverflow.com/q/26352265/843732
 		//			= 0 if other platform
		//			= 1 if running on OS X
		//			= 2 if running on Windows
		//			= 3 if running on Linux
		var bAllowAnim = gl.getPlatformType() != 1;			//Don;t animate on the Mac

		//Details on dynamically creating tabs for Accordion:
		//	http://stackoverflow.com/q/25953570/843732

		//Set accordion ctrl
		$("#accordion").accordion({
				animate: bAllowAnim ? undefined : false,
				collapsible: true,
				heightStyle: "content",
				active: objAccDta.actv,
				create: function(evnt, ui)
				{
					//Called when accordion is created
					if(ui.panel.length > 0)
					{
						//Accordion is created with an open panel
						//INFO: This method is called before the panel is shown
						var objPanel = ui.panel[0];
						var objHdr = ui.header[0];

						gl.onOpenAccordionPage(true, objHdr, objPanel);
					}
				},
				beforeActivate: function(evnt, ui)
				{
					//Called before "Accordion" tab is expanded
					if(ui.newPanel.length > 0)
					{
						//User clicked on the tab and it is about to open
						//INFO: This method is called before the panel is shown
						var objPanel = ui.newPanel[0];
						var objHdr = ui.newHeader[0];

						gl.onOpenAccordionPage(false, objHdr, objPanel);
					}
				},
				activate: function(evnt, ui)
				{
					//Called after "Accordion" tab is expanded or contracted
					if(ui.oldPanel.length > 0)
					{
						//User clicked on the tab and it closed
						//INFO: This method is called after the panel was closed
						var objPanel = ui.oldPanel[0];
						var objHdr = ui.oldHeader[0];

						gl.onCloseAccordionPage(objHdr, objPanel);
					}

					//Play with offsets and scrolling
					if(ui &&
						ui.newHeader &&
						ui.newPanel)
					{
						//Only if opened
						if(ui.newHeader.length > 0 &&
							ui.newPanel.length > 0)
						{
							var offsCap = ui.newHeader.offset();			//Offset from the top of the popup window to the top of the "caption" section of the expanded tab
							var hghtCap = ui.newHeader.outerHeight(false);
							var offsCnt = ui.newPanel.offset();				//Offset from the top of the popup window to the top of the "content" section of the expanded tab
							var hghtCnt = ui.newPanel.outerHeight(true);

							//Get main section offset & height
							var objMainSec = $('#mainSection');
							var offsMainSec = objMainSec.offset();
							var hghtMainSec = objMainSec.outerHeight(true);

							var nCntBtmY = offsCnt.top + hghtCnt - offsMainSec.top;

							//Get the position of the caption top
							var nCapTopY = offsCap.top - offsMainSec.top;

							//Get scroll pos of the main section
							var nScrollPos = objMainSec.scrollTop();

							//Is bottom of the content part below the main section
							if(nCntBtmY + 4 > hghtMainSec)										//Add a little "pumper" at the bottom
							{
								//Need to scroll the main section, see how much
								var nScrollY = nCntBtmY + 4 - hghtMainSec;						//Add a little "pumper" at the bottom

								//Cannot scroll up past the top of the main section
								if(nCapTopY - nScrollY < 0)
								{
									//Need to scroll less
									nScrollY = nCapTopY;
								}

								//Now scroll the main section
								objMainSec.animate(
								{
									//Specify the number of pixels to scroll the '#mainSection' down
									scrollTop: nScrollY + nScrollPos
								}, 100);
							}
							else
							{
								//See if top of the caption is above the top of the main section
								if(nCapTopY < 0)
								{
									//Need to scroll the main section
									objMainSec.animate(
									{
										//Specify the number of pixels to scroll the '#mainSection' down
										scrollTop: nCapTopY - 4 + nScrollPos								//Add a little "pumper" at the bottom
									}, 100);
								}
							}

							//console.log("cap: top=" + offsCap.top + ", h=" + hghtCap + ", cnt: top=" + offsCnt.top + ", h=" + hghtCnt + ", main: top=" + offsMainSec.top + ", h=" + hghtMainSec);
						}
					}
				}
			});
		
		$(".hdrLink").click(function(e){
			//Allows links to be clickable in headers of the "accordion"
			e.stopPropagation();

			//console.log("shift=" + e.shiftKey);

			//Shift-click will "toggle" the meaning of "incognito" flag
			var bIncog = bIncognito;
			if(e.shiftKey)
				bIncog = bIncog ? false : true;

			//Only if "Incognito"
			if(bIncog)
			{
				//Prevent opening the link
				//INFO: If we let it open it, it will open in a "regular" tab
				e.preventDefault();

				var strUrl = $(this).attr('href');
				//console.log("a=" + url);

				//And instead open it in another "Incognito" tab
				chrome.windows.create({
					url: strUrl,
					incognito: true
				});
			}

		});

		//$('#mainSection').animate({
		//	scrollTop: $(".ui-accordion-header-active").offset().top
		//}, 1000);

		//See if we need to scroll to the open tab
		if(gl.isInt(objAccDta.actv))
		{
			//Scroll to the open tab
			var objCap = $(".ui-accordion-header-active");
			var offsCap = objCap.offset();		//Pixel offset from top-left of the popup window (without scrolling)
			var hghtCap = objCap.outerHeight(false);
			var scrlCap = objCap.scrollTop();

			var objMainSec = $('#mainSection');
			var offsMainSec = objMainSec.offset();
			var hghtMainSec = objMainSec.outerHeight(true);

			//var active = $(".selector").accordion("option", "active");

			////Get offset & height of the content part
			//var objCnt = $("#ui-id-" + objAccDta.actv);	//$(".ui-accordion-content");
			//var offsCnt = objCnt.offset();
			//var hghtCnt = objCnt.outerHeight(false);

			//console.log("cap: left=" + offsCap.left + ", top=" + offsCap.top + ", h=" + hghtCap + ", scrl=" + scrlCap + ", main: left=" + offsMainSec.left + ", top=" + offsMainSec.top + ", h=" + hghtMainSec);

			//Get bottom of the active caption (relative to the top of the '#mainSection' section)
			var nCapBtm = offsCap.top - offsMainSec.top - scrlCap + hghtCap;

			//Scroll if active tab is lower than 1/3 of the '#mainSection' section height
			var nScrollCutoffY = hghtMainSec * 1 / 3;
			if(nCapBtm > nScrollCutoffY)
			{
				objMainSec.animate(
				{
					//Specify the number of pixels to scroll the '#mainSection' down
					scrollTop: nCapBtm - nScrollCutoffY + objMainSec.scrollTop()
				}, 100);
			}

			//console.log("nCapBtm=" + nCapBtm);

			//var activeTabOffset = offsCap.top;
			//var mainSectionHeight = objMainSec.height();

		//	if (activeTabOffset > mainSectionHeight) 
			//{
			//	$('#mainSection').animate(
			//	{
			//		//Specify the number of pixels to scroll the '#mainSection' down
			//		scrollTop: 100 //$(".ui-accordion-header-active").offset().top
			//	}, 100);
			//}
		}

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



	onOff: function()
	{
		//When On/Off small toolbar button is clicked

		//Toggle the value
		gl.enableDataCollection(gl.getSettingsRef().bCollectData ? false : true);
	},
	
	setOnOffButton: function()
	{
		//Set small toolbar button for On/Off switch

		//Get settings object
		var stngs = gl.getSettingsRef();

		var btn = $("#tbBtnOnOff");
		var objBody = $("body");

		var bShowBtn = true;

		//See if we're in the incognito tab and not allowed to collect incog data
		if(gl.gbIncogTab &&
			!stngs.bIncogCollectData)
		{
			//Don't show this button
			bShowBtn = false;
		}

		//console.log("bShowBtn=" + bShowBtn);

		if(bShowBtn)
		{
			//Show button
			btn.show();

			//Is data collection on?
			var bOn = stngs.bCollectData;
		
			//First remove both classes
			btn.removeClass("toolbarBtnOn toolbarBtn");
			btn.removeClass("toolbarBtnOff toolbarBtn");
		
			//Set button's look by changing its class
			if(bOn)
			{
				//ON
			
				//Set button look
				btn.addClass("toolbarBtnOn toolbarBtn");
			
				//Set button tooltip
				btn.attr("title", this.encodeHtml(chrome.i18n.getMessage("promptToolbarButton_On")));
			
				//Set background look
				objBody.removeClass("bkgndDsbld");
			}
			else
			{
				//OFF
			
				//Set button look
				btn.addClass("toolbarBtnOff toolbarBtn");
			
				//Set button tooltip
				btn.attr("title", this.encodeHtml(chrome.i18n.getMessage("promptToolbarButton_Off")));
			
				//Set background look
				objBody.addClass("bkgndDsbld");
			}
		}
		else
		{
			//Hide this button
			btn.hide();

			//Set body to display red
			objBody.addClass("bkgndDsbld");
		}
	},
	
	enableDataCollection: function(bEnable)
	{
		//Enable of disable collection of data
		var bgPage = chrome.extension.getBackgroundPage();
		
		//Enable or disable it
		bgPage.gl.enableDataCollection(bEnable ? true : false);

		//Update the toolbar button
		gl.setOnOffButton();
		
		//Update active icon
		bgPage.gl.updateActiveTabIconAndBadge();

		////And update the badge icon
		//bgPage.gl.updateInfoFromActiveTab(/*function()
		////{
		////	//When done, update the badge for the active tab
		////	bgPage.gl.updateActiveTabIconAndBadge();
		////}*/);
	},
	
	
    showOptions: function(strTabID)
    {
        //Opens the Settings window (in the same window if it was already shown)
		//'strTabID' = if specified, tab ID to show (example: "tabGeneral")
        var bgPage = chrome.extension.getBackgroundPage();
        
		bgPage.gl.openAppSettingsWindow(strTabID);

		//And close this popup
		window.close();
    },
	
    showInfoWindow: function(bClosePopup, strTabID)
    {
        //Opens the Info window (in the same window if it was already shown)
		//'bClosePopup' = true to close the popup window as well
		//'strTabID' = if specified, tab ID to show (example: "tabAbout")
		var bgPage = chrome.extension.getBackgroundPage();
		bgPage.gl.openAppInfoWindow(strTabID);

		if(bClosePopup === true)
		{
			//And close this popup
			window.close();
		}
	},
	

	getPageZoom: function()
	{
		//RETURN:
		//		= Page zoom values, as 1.0 being 100%, etc.
		//		= If fails, returns 1.0 and logs an error
		var zoom = 1;

		try
		{
			//INFO: We'll use the "trick" described here: http://stackoverflow.com/a/16091319/843732
			var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			svg.setAttribute('version', '1.1');
			document.body.appendChild(svg);
			zoom = svg.currentScale;
			document.body.removeChild(svg);
		}
		catch(e)
		{
			//Exception
            gl.logExceptionReport(210, e);
		}

		return zoom;
	},

	updateOptionsPage: function()
	{
		//Request an update from the Options page, if it's displayed
		var bgPage = chrome.extension.getBackgroundPage();
		bgPage.gl.updateOptionsPage();
	},

	extractIframeInfo: function(frameUrl)
	{
		//Extract IFRAME url and index from 'frameUrl'
		//RETURN:
		//		= Object with props:
		//			'url'	= URL
		//			'idx'	= Index of the IFRAME, or "" for main page (example: "2" or "0_4" for a nested IFRAME)
		var strUrl = "";
		var strInd = "";

		if(frameUrl)
		{
			//Look for something like this: "0_0>https://forum.acronis.com"
			var arr = frameUrl.match(/([\d_]+)\>(.*)/);
			if(arr &&
				arr.length == 3)
			{
				//Found a match
				strInd = arr[1];
				strUrl = arr[2];
			}
			else
			{
				//No match
				strUrl = frameUrl;
			}
		}

		return {
			url: strUrl,
			idx: strInd
		};
	},


	toggleException: function(url, nSetType, bUpdateBadgeIcon)
	{
		//Toggle exception for 'url'
		//'nSetType' = type of exception (used for setting only):
		//				0	= add site exception
		//				1	= add page exception
		//'bUpdateBadgeIcon' = set to 'true' to update active badge icon
		var bgPage = chrome.extension.getBackgroundPage();
		bgPage.gl.toggleException(url, nSetType, bUpdateBadgeIcon);
	},


	setShiftKeyTracking: function()
	{
		//Set events that track SHIFT key
		window.addEventListener("keydown", function(e)
		{
			gl.gbShiftOn = e.shiftKey;
			//console.log("Key down, shift=" + e.shiftKey);
		});

		window.addEventListener("keyup", function(e)
		{
			gl.gbShiftOn = e.shiftKey;
			//console.log("Key up, shift=" + e.shiftKey);
		});
	},


	adjustMainSectionHeight: function()
	{
		//Adjust height of the scrollable section to the height of the popup window
		var objMain = $("#mainSection");
		var rcMain = objMain.offset();
		var wnd = $(window);
		
//		var oWnd = wnd[0];
//		console.log("devicePixelRatio=" + oWnd.devicePixelRatio);

		//Get current zoom
		var zoom = gl.getPageZoom();

		//Make sure we got the zoom
		if(zoom === null ||
			zoom === undefined)
		{
			zoom = 1;
		}

		//var v1 = $(window).width();
		//var v2 = screen.width;
		//var zoom = z;//document.body.style.zoom;
		//console.log("Page zoom=" + zoom + ", v1=" + v1 + ", v2=" + v2);
		
		var hm = objMain.outerHeight();
		hm *= zoom;
//		console.log("rc=" + rcMain.top);
		
		var nMainTop = rcMain.top;
		nMainTop *= zoom;

		var wndH = wnd.height();
		wndH *= zoom;
		var nH = nMainTop + hm;

		var offBtm = wndH - nH;
		
		var nNewH = 600 - nMainTop - offBtm - 10 * zoom;		//We'll assume 10px margin, and 600px window height
		
		//Make height an integer
		var nHghtPx = nNewH /zoom;
		nHghtPx = ~~nHghtPx;

		//nHghtPx -= 40;

		//content.style.height = availableheight + 'px';
		objMain.css("max-height", nHghtPx  + 'px');
		
		//console.log("v=" + nNewH);
	}

};



//!!!First thing!!!! -- make sure to override the console calls
gl.overrideConsole();


//Localize HTML page
gl.localizeHtmlPage();

//Do we need to display special scrollbars?
if(!gl.getSettingsRef().bUseNativeScrollbars)
{
	//Apply CSS styles for this app's special scrollbars
	$('head').append('<link rel="stylesheet" href="popup_scrlbrs.css" type="text/css">');
}

//Add shift key listener
gl.setShiftKeyTracking();

//Use a hack to open a port between popup window and the background.js
//INFO: We need to do this to track when popup is opened & closed
var port = chrome.runtime.connect({name: "port_popup"});
port.postMessage({action: "init"});

//Adjust CSS for main div
gl.adjustMainSectionHeight();
	
	
//Get active tab
chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
{
	//Get reference to background page
	var bgPage = chrome.extension.getBackgroundPage();

	//Get current tab
	var tab = tabs.length > 0 ? tabs[0] : null;
		
	//Get currently active URL
	var tabUrl = tab ? tab.url : "";

	//Get tab ID
	gl.gnTabID = tab.id;

	//Remember active URL
	gl.gstrActvURL = tabUrl;

	//Set it as last visited URL (just in case it wasn't set)
	//bgPage.gl.gstrLastVisitedTabURL = tabUrl;

	//Are we calling it from "Incognito" tab?
	gl.gbIncogTab = tab ? tab.incognito : false;
	
	//Set on/off toolbar button
	gl.setOnOffButton();

	//Set popup page Formalizr logo depending on the incognito tab
	$("#idPopupLogo").attr("src", !gl.gbIncogTab ? "images/app-logo_med.png" : "images/app-logo_med_incog.png");
		
	//Add toolbar event handlers
	gl.addToolbarEventHandlers();
	

	//Send a request to update the data from the page
	bgPage.gl.updateInfoFromTab(tab ? tab.id : null);
	
	//We need to wait a little bit for the data to be collected...
	//INFO: Since the page migth have several iframes, the call above may invoke several responses from those IFRAMEs
	window.setTimeout(function()
	{
		//After the wait...

		//console.log("### Page init: " + new Date() + ", URL=" + tabUrl);
		//console.log("Incog=" + bIncog);
	
		//First remove the initialization spinner
		$("#initSpnr").remove();
		
	
		//Add event handlers
		gl.addPageEventHandlers();
	

		//And build an "Accordion"
		gl.createAccordion(tabUrl);

		////Is shift key pressed
		//if(gl.gbShiftOn)
		//{
		//	//Show Info window for the bug report
		//	//gl.showInfoWindow(false, "tabFeedback");

		//	//gl.logReport("Shift key was on...");
		//}

	}, 50);
});




