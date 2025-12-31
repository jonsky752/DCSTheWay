import f16 from "./f16";
import f15e from "./f15e";
import fa18 from "./fa18";
import ah64 from "./ah64";
import a10 from "./a10";
import m2000 from "./m2000";
import av8b from "./av8b";
import ka50 from "./ka50";
import miragef1 from "./miragef1";
import uh60l from "./uh60l";
import hercules from "./Hercules";
import oh58d from "./oh58d";
import ch47f from "./ch47f";
import sa342 from "./sa342";
import c130j from "./c130j";

export default function getModuleCommands(module, waypoints, buttonExtraDelay) {
  switch (module) {
    case "F-15ESE_pilotAJDAM":
      case "F-15ESE_wsoAJDAM":
      case "F-15ESE_pilotBJDAM":
      case "F-15ESE_wsoBJDAM":
      case "F-15ESE_pilotANOJDAM":
      case "F-15ESE_wsoANOJDAM":
      case "F-15ESE_pilotBNOJDAM":
      case "F-15ESE_wsoBNOJDAM":
        f15e.slotVariant = module;
        f15e.extraDelay = buttonExtraDelay;
        return f15e.createButtonCommands(waypoints);
    case "F-16C_50":
    case "F-16D_50":
    case "F-16D_50_NS":
    case "F-16D_52":
    case "F-16D_52_NS":
    case "F-16D_Barak_30":
    case "F-16D_Barak_40":
    case "F-16I": {
      f16.extraDelay = buttonExtraDelay;
      return f16.createButtonCommands(waypoints);
    }
    case "FA-18C_hornet":
    case "FA-18C_hornetPP1":
    case "FA-18C_hornetPP2":
    case "FA-18C_hornetPP3":
    case "FA-18C_hornetPP4":
    case "FA-18E":
    case "FA-18F":
    case "EA-18G": {
      fa18.slotVariant = module;
      fa18.extraDelay = buttonExtraDelay;
      return fa18.createButtonCommands(waypoints);
    }
    case "AH-64D_BLK_IIpilot": {
      ah64.extraDelay = buttonExtraDelay;
      ah64.slotVariant = "AH-64D_BLK_IIpilot";
      return ah64.createButtonCommands(waypoints);
    }
    case "AH-64D_BLK_IIgunner": {
      ah64.extraDelay = buttonExtraDelay;
      ah64.slotVariant = "AH-64D_BLK_IIgunner";
      return ah64.createButtonCommands(waypoints);
    }
    case "M-2000C": {
      m2000.extraDelay = buttonExtraDelay;
      return m2000.createButtonCommands(waypoints);
    }
    case "SA342L":
    case "SA342M":
    case "SA342Minigun": {
      sa342.extraDelay = buttonExtraDelay;
      return sa342.createButtonCommands(waypoints);
    }
    case "ka50WPT":
    case "ka50TGT":{
      ka50.slotVariant = module;
      ka50.extraDelay = buttonExtraDelay;
      return ka50.createButtonCommands(waypoints);
    }
    case "Mirage-F1EE": {
      miragef1.extraDelay = buttonExtraDelay;
      return miragef1.createButtonCommands(waypoints);
    }
    case "UH-60L": {
      uh60l.extraDelay = buttonExtraDelay;
      return uh60l.createButtonCommands(waypoints);
    }
    case "Hercules": {
      hercules.extraDelay = buttonExtraDelay;
      return hercules.createButtonCommands(waypoints);
    }
    case "OH58Dright-seat": {
      oh58d.extraDelay = buttonExtraDelay;
      oh58d.slotVariant = "OH58Dright-seat";
      return oh58d.createButtonCommands(waypoints);
    }
    case "OH58Dleft-seat": {
      oh58d.extraDelay = buttonExtraDelay;
      oh58d.slotVariant = "OH58Dleft-seat";
      return oh58d.createButtonCommands(waypoints);
    }
    case "AV8BNA_WPT":
    case "AV8BNA_TRGPT": {
      av8b.slotVariant = module;
      av8b.extraDelay = buttonExtraDelay;
      return av8b.createButtonCommands(waypoints);
    }
    case "ch47ADD":
    case "ch47NEW":
    case "ch47ALTADD":
    case "ch47ALTNEW": {
      ch47f.slotVariant = module;
      ch47f.extraDelay = buttonExtraDelay;
      return ch47f.createButtonCommands(waypoints);
    }
    case "a10ADD":
    case "a10NEW": {
      a10.slotVariant = module;
      a10.extraDelay = buttonExtraDelay;
      return a10.createButtonCommands(waypoints);
    }
    case "c130Plt":
    case "c130CoPlt":{
      c130j.slotVariant = module;
      c130j.extraDelay = buttonExtraDelay;
      return c130j.createButtonCommands(waypoints);
    }

    default:
      return [];
  }
}