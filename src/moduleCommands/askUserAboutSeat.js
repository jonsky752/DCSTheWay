import {
  TwoOptionsDialog,
  TwoOptionsSimpleDialog,
} from "../components/TwoOptionsDialog";
import { FourOptionsSimpleDialog } from "../components/FourOptionsDialog";
import { AlertDialog } from "../components/AlertDialog";

const askUserAboutSeat = async (module, userPreferences) => {
  const moduleSpecificPreferences = userPreferences[module];

  
  
  //////////////////////////////////////////////////////////////////////   AH-64D   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  
  if (module === "AH-64D_BLK_II") {
    if (moduleSpecificPreferences?.includes("Pilot"))
      return "AH-64D_BLK_IIpilot";
    else if (moduleSpecificPreferences?.includes("CPG/Gunner"))
      return "AH-64D_BLK_IIgunner";
    else {
      return TwoOptionsDialog({
        title: "What seat are you in?",
        op1: "Pilot",
        op2: "CPG/Gunner",
      }).then((option) =>
        option === "CPG/Gunner" ? "AH-64D_BLK_IIgunner" : "AH-64D_BLK_IIpilot",
      );
    }
  
   //////////////////////////////////////////////////////////////////////   FA-18   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  
  
  } else if (
    module === "FA-18C_hornet" ||
    module === "FA-18E" ||
    module === "FA-18F" ||
    module === "EA-18G"
  ) {
    let PPinput;
    await TwoOptionsSimpleDialog({
      title: "Input as PP MSN?",
      op1: "YES",
      op2: "NO",
    }).then((pp) => (PPinput = pp));

    let stations = "";
    if (PPinput === "YES") {
      await FourOptionsSimpleDialog({
        title: "How many STATIONs carry this weapon?",
        op1: "1",
        op2: "2",
        op3: "3",
        op4: "4",
      }).then((sta) => (stations = sta));
    }
    let hide = false;
    if (moduleSpecificPreferences?.includes("Hide")) {
      hide = true;
    }
    if (hide === false) {
      if (PPinput === "YES") {
        await AlertDialog({
          title: "Please make sure that",
          content: "Your LEFT MDI is on PP MSN Page!\n",
        });
      } else {
        await AlertDialog({
          title: "Please make sure that",
          content:
            "1. PRECISE option is boxed in HSI > DATA\n" +
            "2. You are not in the TAC menu\n" +
            "3. You are in the 00°00.0000' coordinate format",
        });
      }
    }
    return `FA-18C_hornet${PPinput === "YES" ? "PP" : ""}${stations}`;

  
       //////////////////////////////////////////////////////////////////////   F-15E   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

      } else if (module === "F-15ESE") {
        let seat;
        if (moduleSpecificPreferences?.includes("Pilot")) seat = "Pilot";
        else if (moduleSpecificPreferences?.includes("WSO")) seat = "WSO";
        else {
          await TwoOptionsDialog({
            title: "What seat are you in?",
            op1: "Pilot",
            op2: "WSO",
          }).then((chosenSeat) => (seat = chosenSeat));
        }
    
        let jdam;
        await TwoOptionsSimpleDialog({
          title: "Input for JDAMs?",
          op1: "YES",
          op2: "NO",
        }).then((forJDAM) => (jdam = forJDAM));
    
        let route = jdam === "YES" ? "B{1/B}" : "A{1/A}";
    
        let hide = false;
        if (moduleSpecificPreferences?.includes("Hide")) {
          hide = true;
        }
        if (hide === false) {
          if (seat === "Pilot" && jdam === "YES") {
            await AlertDialog({
              title: "Make sure:",
              content:
                "1. Your RIGHT MPD is on Smart Weapons page.\n" +
                "2. Used 'NXT STA' to select the bomb you want to start with.\n" +
                "3. Do not program the JDAMs in PACS.(Recommended)",
            });
          } else if (seat === "WSO" && jdam === "YES") {
            await AlertDialog({
              title: "Make sure:",
              content:
                "1. The airplane's master mode is A/G\n" +
                "2. Your RIGHT MPD(Green display) is on Smart Weapons page.\n" +
                "3. Used 'NXT STA' to select the bomb you want to start with.\n" +
                "4. Do not program the JDAMs in PACS.(Recommend)",
            });
          }
        }
    
        return `F-15ESE_${seat.toLowerCase()}${route === "A{1/A}" ? "A" : "B"}${
          jdam === "YES" ? "JDAM" : "NOJDAM"
        }`;
    
    
   //////////////////////////////////////////////////////////////////////   UH-60L + Hercules Mods   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  
  } else if (module === "UH-60L") {
    if (moduleSpecificPreferences?.includes("Hide")) return "UH-60L";
    else {
      return AlertDialog({
        title: "Be advised:",
        content:
          "This may overwrite waypoints! " +
          "If WP/TGT is on MIZ0 (00), 01 onwards will be overwritten.",
      }).then(() => "UH-60L");
    }
  } else if (module === "Hercules") {
    if (moduleSpecificPreferences?.includes("Hide")) return "Hercules";
    else {
      return AlertDialog({
        title: "Be advised:",
        content:
          "Make sure you have downloaded the Patch for the Hercules module: https://github.com/Summit60/DCS-Hercules-TheWay-patch",
      }).then(() => "Hercules");
    }
  
  
   //////////////////////////////////////////////////////////////////////   OH-58D   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  
  } else if (module === "OH58D") {
    if (moduleSpecificPreferences?.includes("Right Seat"))
      return "OH58Dright-seat";
    else if (moduleSpecificPreferences?.includes("Left Seat"))
      return "OH58Dleft-seat";
    else {
      return TwoOptionsDialog({
        title: "What seat are you in?",
        op1: "Right Seat",
        op2: "Left Seat",
      }).then((option) =>
        option === "Left Seat" ? "OH58Dleft-seat" : "OH58Dright-seat",
      );
    }
  
  
     //////////////////////////////////////////////////////////////////////   CH-47F   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  
    } else if (module === "CH-47Fbl1") {
      if (moduleSpecificPreferences?.includes("Add to FLPN")) {
        return "ch47ADD";
      } else if (moduleSpecificPreferences?.includes("Make New FPLN")) {
        return "ch47NEW";
      } else if (moduleSpecificPreferences?.includes("Add to ALT FLPN")) {
        return "ch47ALTADD";
      } else if (moduleSpecificPreferences?.includes("Make New FLPN")) {
        return "ch47ALTNEW";
      } else {
        return FourOptionsSimpleDialog({
          title: "Would you like to?",
          op1: "Add to FLPN",
          op2: "Make New FLPN",
          op3: "Add to ALT FLPN",
          op4: "Make New ALT FLPN",
        }).then((option) => {
          switch (option) {
            case "Add to FLPN":
              return "ch47ADD";
            case "Make New FLPN":
              return "ch47NEW";
            case "Add to ALT FLPN":
              return "ch47ALTADD";
            case "Make New ALT FLPN":
              return "ch47ALTNEW";
            default:
              throw new Error("Invalid option selected");
          }
        });
      }
  
  


  /*
  } else if (module === "CH-47Fbl1") {
    if (moduleSpecificPreferences?.includes("Add to FLPN"))
      return "ch47ADD";
    else if (moduleSpecificPreferences?.includes("Make New FPLN"))
      return "ch47NEW";
    else {
      return TwoOptionsDialog({
        title: "Would you like to?",
        op1: "Add to FPLN",
        op2: "Make New FPLN",
      }).then((option) =>
        option === "Add to FPLN" ? "ch47ADD" : "ch47NEW",
      );
    }
  */
  
   //////////////////////////////////////////////////////////////////////   A-10C/2   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  
  } else if (module === "A-10C" ||  module === "A-10C_2") {
    if (moduleSpecificPreferences?.includes("Add Waypoints"))
      return "a10ADD";
    else if (moduleSpecificPreferences?.includes("Overwrite Waypoints"))
      return "a10NEW";
    else {
      return TwoOptionsDialog({
        title: "Would you like to?",
        op1: "Add Waypoints",
        op2: "Overwrite Waypoints",
      }).then((option) =>
        option === "Add Waypoints" ? "a10ADD" : "a10NEW",
      );
    }  
   
  
    //////////////////////////////////////////////////////////////////////   AV8BNA   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  
  } else if (module === "AV8BNA") {
      if (moduleSpecificPreferences?.includes("Waypoints"))
        return "AV8BNA_WPT";
      else if (moduleSpecificPreferences?.includes("Targetpoints"))
        return "AV8BNA_TRGPT";
      else {
        return TwoOptionsDialog({
          title: "Transfer to waypoints or target points?",
          op1: "Waypoints",
          op2: "Targetpoints",
        }).then((option) =>
          option === "Targetpoints" ? "AV8BNA_TRGPT" : "AV8BNA_WPT",
      );
    }

    //////////////////////////////////////////////////////////////////////   Ka-50   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  } else if (module === "Ka-50" || module === "Ka-50_3") {
    if (moduleSpecificPreferences?.includes("Waypoints"))
      return "ka50WPT";
    else if (moduleSpecificPreferences?.includes("Targetpoints"))
      return "ka50TGT";
    else {
      return TwoOptionsDialog({
        title: "Enter as?",
        op1: "Waypoints",
        op2: "Targetpoints",
      }).then((option) =>
        option === "Targetpoints" ? "ka50TGT" : "ka50WPT"
      );
    }


  } else return module;
};

export default askUserAboutSeat;
