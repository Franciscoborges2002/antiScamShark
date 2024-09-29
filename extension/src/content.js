async function getValues() {
  // Helper function to wrap chrome.storage.local.get in a promise
  const getStorageData = (key) =>
    new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        } else {
          resolve(JSON.parse(result[key]));
        }
      });
    });

  try {
    // Start all storage retrievals concurrently
    const [
      resultJSONTrust,
      resultJSONScam,
      resultJSONhistory,
      resultJSONsettings,
    ] = await Promise.all([
      getStorageData("trustWebsites"),
      getStorageData("scamWebsites"),
      getStorageData("historyWebsites"),
      getStorageData("settings"),
    ]);

    /* throw new Error("errrroororr"); */

    // Return the results
    return [
      resultJSONTrust,
      resultJSONScam,
      resultJSONhistory,
      resultJSONsettings,
    ];
  } catch (error) {
    console.error("Error retrieving data:", error);
    injectPopup("error", "getting the data from storage");
  }
}

//Main function
async function verifyWebsite(
  resultJSONTrust,
  resultJSONScam,
  resultJSONhistory,
  resultJSONsettings
) {
  console.log(resultJSONScam); // This will log the data once it's available
  console.log(resultJSONTrust); // This will log the data once it's available
  console.log(resultJSONhistory); // This will log the data once it's available
  console.log(resultJSONsettings); // This will log the data once it's available

  console.log("🦈steamShark started!"); //Just to register what ASteamShark did on console

  var url = window.location.href; //Get the url of the page
  console.log("🦈steamShark: url is " + url);

  let urlVerify;
  let isLegit = true;

  // Remove the http and https for scam website list
  urlVerify = url
    .replace("http://", "")
    .replace("https://", "")
    .replace("/", "");

  //Create the objects to verify in trust list
  const urlObject = new URL(url); // Make an URL object
  const domain = urlObject.origin + "/"; // Get the origin of the url and add "/"

  // Verify if it's in the list of scam websites
  if (resultJSONScam.data.includes(urlVerify)) {
    console.log("🦈steamShark: The website is in the scam list!");
    isLegit = false;

    //Register the website to the history
    const responseHistory = await chrome.runtime.sendMessage({
      action: "registerHistoryStorage",
      trusted: false,
    });

    //Check if is to redirect or only show popUp
    if (resultJSONsettings.data.redirectToWarningPage) {
      console.log("🦈steamShark: Redirecting to warning page!"); //Just to register what ASteamShark did on console

      const response = await chrome.runtime.sendMessage({
        action: "redirectWarningPage",
      });
    } else {
      //Only show popUp
      console.log("🦈steamShark: Show scam popup!");
      injectPopup(false, domain);
    }

    //Return from the function
    return;
  }

  // Iterate through the data from the JSON to see if the URL is in the list
  const isTrustworthy =
    resultJSONTrust.data.filter((item) => item.url === domain).length > 0;

  // Verify if it's in the list of trustworthy websites
  if (isTrustworthy) {
    console.log("The website is in the trust list.");

    //Register the website to the history
    await chrome.runtime.sendMessage({
      action: "registerHistoryStorage",
      trusted: true,
    });


    /*
     * If it is not a scam website, and is trust worthy
     * Before injecting the html, lets check if its in the last x minutes(get in options) of the history
     */

    injectPopup(true, domain);

    //Return from the function
    return;
  }

  console.log(isLegit); // Example usage
}

/*
Function to initiate everything, 
*/
async function start() {
  try {
    const data = await getValues();

    verifyWebsite(data[0], data[1], data[2], data[3]);
  } catch (error) {
    console.error("Error retrieving data: ", error);
  }
}

//Start the initial function to execute all stuff
start();

/*
Function to inject a popup in the page
*/
function injectPopup(succeded, textAdd) {
  const body = document.querySelector("body");
  const newDiv = document.createElement("div");
  const closeButton = document.createElement("button"); //button to make it disappear

  switch (succeded) {
    case true:
      newDiv.innerHTML = `<h5>🦈 ${textAdd} is trusted!</h5>`;
      newDiv.style.backgroundColor = "rgba(11,156,49,0.85)";
      break;
    case false:
      newDiv.innerHTML = `<h5>🦈 ${textAdd} is NOT trusted!</h5>`;
      newDiv.style.backgroundColor = "rgba(255,3,3,0.85)";
      break;
    case "error":
      newDiv.innerHTML = `<h5>🦈steamShark An error occurred while trying to ${textAdd}.</h5>`;
      newDiv.style.backgroundColor = "rgba(255,165,0,0.85)";
      break;
  }

  // Assign a unique ID to the div
  newDiv.id = "steamSharkPopUp";

  //Add propreties to the butotn
  closeButton.textContent = "X";
  closeButton.style.width = "30px";
  closeButton.style.height = "30px";
  closeButton.style.backgroundColor = "white";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "5px";
  closeButton.style.cursor = "pointer";
  closeButton.style.fontWeight = "bold";
  closeButton.style.color = "black";
  closeButton.style.fontSize = "small";

  closeButton.addEventListener("click", function () {
    newDiv.remove(); // Remove the popup when the button is clicked
  });

  newDiv.appendChild(closeButton); // Append the button to the newDiv

  //Div style
  newDiv.style.position = "fixed"; // Added this line
  newDiv.style.top = "4rem";
  newDiv.style.right = "1rem";
  newDiv.style.zIndex = "9999"; // Increased z-index
  newDiv.style.padding = "1rem"; // Add padding around the content
  newDiv.style.display = "flex";
  newDiv.style.flexDirection = "row";
  newDiv.style.gap = "1.5rem";
  newDiv.style.justifyContent = "space-between";
  newDiv.style.borderRadius = "0.75rem";
  newDiv.style.width = "300px";
  newDiv.style.fontSize = "x-large";
  newDiv.style.color = "white";
  newDiv.style.display = "flex";
  newDiv.style.flexDirection = "row";
  newDiv.style.alignItems = "center";

  body.insertAdjacentElement("beforebegin", newDiv);

  // Schedule the div to be removed after 10 seconds
  setTimeout(function () {
    let popupToRemove = document.getElementById("steamSharkPopUp");
    if (popupToRemove) {
      popupToRemove.remove();
    }
  }, 10000); // 10000 milliseconds = 10 seconds
}
