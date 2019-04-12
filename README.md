# Formalizr
*Formalizr, Google Chrome extension - "Remembers what you type, in case of a page crash."*


### Release Files

Can be [downloaded](https://dennisbabkin.com/formalizr/) as a Google Chrome extension.
*(Note that release files are minified.)*


### Basic Operation

As you type into text boxes in web pages:

![Alt text](extension/images/imgMan_MultilineTextbox.png "Form on page")

 Formalizr will try to remember the changes you make. This will be reflected in the app's badge icon ![Alt text](extension/images/imgMan_BadgeIconWithCount1.png "Badge icon") that will display the number of text boxes that it collects input from.

-------

To check the state of the Formalizr app look at its badge icon:

- ![Alt text](extension/images/imgMan_BadgeIconDefault.png "Icon")  Default state, with no data collection on the page.

- ![Alt text](extension/images/imgMan_BadgeIconWithCount4.png "Icon")  Collecting data from 4 text boxes on the page.

- ![Alt text](extension/images/imgMan_BadgeIconIncognito.png "Icon")  Incognito browsing (must be enabled in the web browser settings.)

- ![Alt text](extension/images/imgMan_BadgeIconInactive.png "Icon")  Formalizr is inactive (for example, due to unsupported page URL.)

- ![Alt text](extension/images/imgMan_BadgeIconDisabled.png "Icon")  Data collection is turned off on all web pages.

- ![Alt text](extension/images/imgMan_BadgeIconException.png "Icon")  Data is not collected on the page due to the Site or Page Exception.

-------

You can view all collected data by clicking the Formalizr badge icon ![Alt text](extension/images/imgMan_BadgeIconDefault.png "Badge icon") to show the popup window: 

![Alt text](extension/images/imgMan_PopupOpen.png "Formalizr popup window")

 Click on the page title ![Alt text](extension/images/imgMan_PageTitle.png "Page title") to open the data collected for it: 

![Alt text](extension/images/imgMan_PageCollectedData.png "Collected form data")

Use the slider ![Alt text](extension/images/imgMan_PageSlider.png "Slider") to see changes to collected text over time as you typed it. If the text doesn't fit into the box use the corner gripper ![Alt text](extension/images/imgMan_PageBoxGripper.png "Gripper") to resize it.

-------

To retrieve previously typed text, click the 'Copy' link undernearth ![Alt text](extension/images/imgMan_PageCopyLink.png "Copy link") to copy it to the Clipboard. You can then paste it anywhere else. You can also click the 'Copy All' button ![Alt text](extension/images/imgMan_PopupCopyAll.png "Copy All") to copy additional data from all available text boxes on the page.

-------

If you are at the web page where the data was collected from, you can use the 'Form Fill' button ![Alt text](extension/images/imgMan_PopupFormFill.png "Form Fill button") to restore all collected data straight into the web page itself. You can get to the original page where the data was collected from by clicking the URL link ![Alt text](extension/images/imgMan_PopupURLLink.png "Visit URL button") in the page title.

-------

To remove data collected for the page, click the 'Remove Page Data' button ![Alt text](extension/images/imgMan_PopupRemovePageData.png "Remove Page Data") and confirm removal. (Make sure to do so while not browsing the page whose data you're removing.)

-------

Use the 'Off' button ![Alt text](extension/images/imgMan_PopupOffButton.png "Off button") to turn off data collection from all web pages. When data collection is turned off:

![Alt text](extension/images/imgMan_PopupDisabled.png "Disabled popup")

 use the 'On' button ![Alt text](extension/images/imgMan_PopupOnButton.png "On button") to turn data collection back on. Additionally you can Shift-click the 'On/Off' button ![Alt text](extension/images/imgMan_PopupShiftOffButton.png "Shift-Click On/Off button") to toggle the Site Exception for the current page (or when data collection is turned off for a specific web site.) Likewise, you can ⌘-Shift-click (or Ctrl-Shift-click on Windows/Linux) the 'On/Off' button ![Alt text](extension/images/imgMan_PopupCommandShiftOffButton.png "Command-Shift-Click On/Off button") to toggle the Page Exception for the current page (or when data collection is turned off for a specific web page.) Note that Exceptions can be adjusted later in the Options window.

-------

Use the 'Show options' button ![Alt text](extension/images/imgMan_PopupOptionsButton.png "Show options button") to display the Options window that allows advanced users to adjust Formalizr settings. Or, click the 'Show app information' button ![Alt text](extension/images/imgMan_PopupInformationButton.png "Show app information button") to learn additional information about the Formalizr or to contact our support team.

-------

There are some circumstances when Formalizr will not be able to collect data from the web page:

- Data is not collected from Java, Flash, Silverlight or similar plug-ins.

- Data may not be collected from pages supporting their own draft saving (such as Google Docs, Microsoft Office Online, and others.)

- Data may not be collected from text boxes supporting their own input formatting (such as specialized html markup input, etc.)

----------

For additional information check our [FAQ page](https://dennisbabkin.com/php/faq.php?what=formalizr).
