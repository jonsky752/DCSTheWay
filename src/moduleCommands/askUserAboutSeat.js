import {
  FourOptionsDialog,
  FourOptionsSimpleDialog,
} from "../components/FourOptionsDialog";
import { AlertDialog } from "../components/AlertDialog";

const askUserAboutSeat = async (module, userPreferences) => {
  const moduleSpecificPreferences = userPreferences[module];

  // A-10C/2///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  if (module === "A-10C" || module === "A-10C_2") {
    if (moduleSpecificPreferences?.includes("Add Waypoints")) return "a10ADD";
    if (moduleSpecificPreferences?.includes("Overwrite Waypoints")) return "a10NEW";
    const option = await FourOptionsDialog({
      title: "Would you like to?",
      op1: "Add Waypoints",
      op2: "Overwrite Waypoints",
    });
    return option === "Add Waypoints" ? "a10ADD" : "a10NEW";
  }

  // AH-64D////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  else if (module === "AH-64D_BLK_II") {
    if (moduleSpecificPreferences?.includes("Pilot")) return "AH-64D_BLK_IIpilot";
    if (moduleSpecificPreferences?.includes("CPG/Gunner")) return "AH-64D_BLK_IIgunner";

    return FourOptionsDialog({
      title: "What seat are you in?",
      op1: "Pilot",
      op2: "CPG/Gunner",
    }).then((option) =>
      option === "CPG/Gunner" ? "AH-64D_BLK_IIgunner" : "AH-64D_BLK_IIpilot"
    );
  }

  // AV8BNA//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  else if (module === "AV8BNA") {
    if (moduleSpecificPreferences?.includes("Waypoints")) return "AV8BNA_WPT";
    if (moduleSpecificPreferences?.includes("Targetpoints")) return "AV8BNA_TRGPT";
    const option = await FourOptionsDialog({
      title: "Transfer to waypoints or target points?",
      op1: "Waypoints",
      op2: "Targetpoints",
    });
    return option === "Targetpoints" ? "AV8BNA_TRGPT" : "AV8BNA_WPT";
  }

  // C-130J////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  else if (module === "C-130J-30") {
    if (moduleSpecificPreferences?.includes("Left Seat")) return "c130Plt";
    if (moduleSpecificPreferences?.includes("Right Seat")) return "c130CoPlt";
    const option = await FourOptionsDialog({
      title: "What seat are you in?",
      op1: "Left Seat",
      op2: "Right Seat",
    });
    return option === "Left Seat" ? "c130Plt" : "c130CoPlt";
  }

  // CH-47F//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  else if (module === "CH-47Fbl1") {
    if (moduleSpecificPreferences?.includes("Add to FLPN")) return "ch47ADD";
    if (moduleSpecificPreferences?.includes("Make New FLPN")) return "ch47NEW";
    if (moduleSpecificPreferences?.includes("Add to ALT FLPN")) return "ch47ALTADD";
    if (moduleSpecificPreferences?.includes("Make New ALT FLPN")) return "ch47ALTNEW";

    const option = await FourOptionsDialog({
      title: "Would you like to?",
      op1: "Add to FLPN",
      op2: "Make New FLPN",
      op3: "Add to ALT FLPN",
      op4: "Make New ALT FLPN",
    });

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
  }

  // F-15E ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  else if (module === "F-15ESE") {
    let seat;
    if (moduleSpecificPreferences?.includes("Pilot")) seat = "Pilot";
    else if (moduleSpecificPreferences?.includes("WSO")) seat = "WSO";
    else {
      seat = await FourOptionsDialog({
        title: "What seat are you in?",
        op1: "Pilot",
        op2: "WSO",
      });
    }

    const jdam = await FourOptionsDialog({
      title: "Input Type?",
      op1: "Waypoints",
      op2: "Target Points",
      op3: "TP's and TXFR to Weapons",
    });

    const routes = {
      Waypoints: "waypoints",
      "Target Points": "targetpoints",
      "TP's and TXFR to Weapons": "txfr",
    };

    const route = routes[jdam];

    const hide = moduleSpecificPreferences?.includes("Hide") ?? false;
    if (!hide) {
      if (seat === "Pilot" && route === "txfr") {
        await AlertDialog({
          title: "Make sure:",
          content:
            "1. Your RIGHT MPD is on Smart Weapons page.\n" +
            "2. Used 'NXT STA' to select the bomb you want to start with.\n" +
            "3. Do not program the JDAMs in PACS.(Recommended)",
        });
      } else if (seat === "WSO" && route === "txfr") {
        await AlertDialog({
          title: "Make sure:",
          content:
            "1. The pilot has selected master mode : A/G\n" +
            "2. Your RIGHT MPD(Green display) is on Smart Weapons page.\n" +
            "3. Used 'NXT STA' to select the bomb you want to start with.\n" +
            "4. Do not program the JDAMs in PACS.(Recommend)",
        });
      }
    }

    return `F-15ESE_${seat.toLowerCase()}_${route}`;
  }

  /// FA-18////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  else if (
    module === "FA-18C_hornet" ||
    module === "FA-18E" ||
    module === "FA-18F" ||
    module === "EA-18G"
  ) {
    // Use saved preference if it exists
    let PPinput;
    if (moduleSpecificPreferences?.includes("YES")) {
      PPinput = "YES";
    } else if (moduleSpecificPreferences?.includes("NO")) {
      PPinput = "NO";
    } else {
      // Ask user and allow "remember this choice"
      PPinput = await FourOptionsDialog({
        title: "Input as PP MSN?",
        op1: "YES",
        op2: "NO",
      });
    }

    let stations = "";
    if (PPinput === "YES") {
      stations = await FourOptionsSimpleDialog({
        title: "How many STATIONs carry this weapon?",
        op1: "1",
        op2: "2",
        op3: "3",
        op4: "4",
      });
    }

    const hide = moduleSpecificPreferences?.includes("Hide") ?? false;

    if (!hide) {
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
  }

  // Hercules//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  else if (module === "Hercules") {
    if (moduleSpecificPreferences?.includes("Hide")) return "Hercules";
    return AlertDialog({
      title: "Be advised:",
      content:
        "Make sure you have downloaded the Patch for the Hercules module: https://github.com/Summit60/DCS-Hercules-TheWay-patch",
    }).then(() => "Hercules");
  }

  // Ka-50 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  else if (module === "Ka-50" || module === "Ka-50_3") {
    if (moduleSpecificPreferences?.includes("Waypoints")) return "ka50WPT";
    if (moduleSpecificPreferences?.includes("Targetpoints")) return "ka50TGT";
    const option = await FourOptionsDialog({
      title: "Enter as?",
      op1: "Waypoints",
      op2: "Targetpoints",
    });
    return option === "Targetpoints" ? "ka50TGT" : "ka50WPT";
  }

  // OH-58D/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  else if (module === "OH58D") {
    if (moduleSpecificPreferences?.includes("Right Seat")) return "OH58Dright-seat";
    if (moduleSpecificPreferences?.includes("Left Seat")) return "OH58Dleft-seat";
    return FourOptionsDialog({
      title: "What seat are you in?",
      op1: "Right Seat",
      op2: "Left Seat",
    }).then((option) =>
      option === "Left Seat" ? "OH58Dleft-seat" : "OH58Dright-seat"
    );
  }

  // UH-60L///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  else if (module === "UH-60L") {
    if (moduleSpecificPreferences?.includes("Hide")) return "UH-60L";
    return AlertDialog({
      title: "Be advised:",
      content:
        "This may overwrite waypoints! If WP/TGT is on MIZ0 (00), 01 onwards will be overwritten.",
    }).then(() => "UH-60L");
  }

  // default
  else return module;
};

export default askUserAboutSeat;
