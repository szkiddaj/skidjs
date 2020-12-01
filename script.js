var _timeouts = [];
function setTimeout(cb, wait) {
  var cur_time = new Date().getTime();

  _timeouts.push({
    date: cur_time,
    wait: wait,
    call: cb,
    type: "timeout",
  });

  return _timeouts.length - 1;
}
function setInterval(cb, wait) {
  var cur_time = new Date().getTime();

  _timeouts.push({
    date: cur_time,
    wait: wait,
    call: cb,
    type: "interval",
  });

  return _timeouts.length - 1;
}
function clearTimeout(timeout) {
  _timeouts.splice(timeout, 1);
}
function clearInterval(timeout) {
  clearTimeout(timeout);
}
function _setTimeoutOnFrame() {
  var cur_time = new Date().getTime();

  for (var i = 0; i < _timeouts.length; i++) {
    var a = _timeouts[i];

    if (cur_time > a.date + a.wait) {
      a.call(cur_time + a.wait, i);

      if (a.type == "timeout") _timeouts.splice(i, 1);
      else if (a.type == "interval") _timeouts[i].date = cur_time;
    }
  }
}
Global.RegisterCallback("FrameStageNotify", "_setTimeoutOnFrame");

var jsName = "skid.js",
  settings = [
    {
      name: "General",
      options: [
        {
          name: "Resetscore on death",
          type: "checkbox",
        },
      ],
    },
    {
      name: "Clantag",
      options: [
        {
          name: "Enable",
          type: "checkbox",
        },
        {
          name: "Text",
          type: "textbox",
        },
        {
          name: "Animation",
          type: "dropdown",
          values: ["Gamesense"],
          default: "Gamesense",
        },
      ],
    },
    {
      name: "Killmsg",
      options: [
        {
          name: "Enable",
          type: "checkbox",
        },
        {
          name: "Messages ( Separate with + )",
          type: "textbox",
        },
      ],
    },
    {
      name: "Min. dmg",
      options: [
        {
          name: "[skid.js] Min damage override",
          short: "Mindmg override",
          type: "hotkey",
        },
        {
          name: "Minimum damage",
          type: "slider",
          min: 0,
          max: 100,
        },
      ],
    },
    {
      name: "Kill sound",
      options: [
        {
          name: "Enable",
          type: "checkbox",
        },
        {
          name: "Playback",
          type: "checkbox",
        },
        {
          name: "Sound(s) (Separate file names with +)",
          type: "textbox",
        },
        {
          name: "Sound length (in sec)",
          type: "slider",
          min: 0.0,
          max: 10.0,
        },
      ],
    },
  ];

function main() {
  for (var index = 0; index < settings.length; index++) {
    const value = settings[index],
      tabName = jsName + " - " + value.name;

    UI.AddSubTab(["Config", "SUBTAB_MGR"], tabName);

    for (var i = 0; i < value.options.length; i++) {
      const val = value.options[i];
      if (!val.type) continue;
      const path = ["Config", tabName, tabName];
      switch (val.type) {
        case "textbox":
          UI.AddTextbox(path, val.name);
          break;
        case "checkbox":
          UI.AddCheckbox(path, val.name);
          break;
        case "dropdown":
          UI.AddDropdown(path, val.name, val.values, 0);
          break;
        case "hotkey":
          UI.AddHotkey(
            ["Config", "SUBTAB_MGR", "Scripts", "SHEET_MGR", "Keys", "JS Keybinds"],
            val.name,
            val.short || val.name
          );
          break;
        case "slider":
          UI.AddSliderInt(path, val.name, val.min || 0, val.max || 100);
          break;
        default:
          break;
      }
    }
  }
}

main();

// General
function resetscore_main() {
  const tabName = jsName + " - General",
    enabled = UI.GetValue(["Config", tabName, tabName, "Resetscore on death"]),
    me = Entity.GetLocalPlayer(),
    victim = Entity.GetEntityFromUserID(Event.GetInt("userid"));

  if (enabled && me == victim) Cheat.ExecuteCommand("rs");
}
Cheat.RegisterCallback("player_death", "resetscore_main");

// Clantag
var CT = {};

function clantag_main() {
  const tabName = jsName + " - Clantag";

  var enabled = UI.GetValue(["Config", tabName, tabName, "Enable"]);
  var anim = UI.GetString(["Config", tabName, tabName, "Animation"]);
  var text = UI.GetString(["Config", tabName, tabName, "Text"]);

  if (!enabled) {
    Local.SetClanTag("");
    setTimeout(clantag_main, 2500);
    return;
  }

  if (!CT.animation || anim != CT.animation || !CT.text || text != CT.text)
    CT = {
      animation: anim,
      text: text,
    };

  const tag = CT.text.slice(0, 14),
    _tag = "",
    timeout = 500;

  switch (anim) {
    case "Gamesense":
      if (!CT.state || !CT.from) {
        CT.state = "write";
        CT.from = 0;
      }

      if (CT.state == "write")
        if (CT.from < tag.length) CT.from += 1;
        else CT.state = "remove";
      else if (CT.from > 0) CT.from -= 1;
      else CT.state = "write";

      _tag = CT.state == "write" ? tag.slice(0, CT.from) : tag.slice(tag.length - CT.from, tag.length);
      timeout = CT.state == "write" ? 400 : 225;

      break;
    default:
      break;
  }

  Local.SetClanTag(_tag);

  setTimeout(clantag_main, timeout || 500);
}

clantag_main();

// Killmsg

var shots = {};

function killmsg_main() {
  const tabName = jsName + " - Killmsg",
    enabled = UI.GetValue(["Config", tabName, tabName, "Enable"]);

  if (!enabled) return;

  if (
    Entity.GetLocalPlayer() == Entity.GetEntityFromUserID(Event.GetInt("attacker")) &&
    Entity.GetLocalPlayer() != Entity.GetEntityFromUserID(Event.GetInt("userid"))
  ) {
    var msgStr = UI.GetString(["Config", tabName, tabName, "Messages ( Separate with + )"]),
      allMsg = msgStr.split("+"),
      msg = allMsg[Math.floor(Math.random() * allMsg.length)];

    msg = msg.replace("_v", Entity.GetName(victim) || "nn").replace("_shots", shots[victimId] || 1);
    Cheat.ExecuteCommand("say " + msg);
    delete shots[victimId];
  } else shots = {};
}
Cheat.RegisterCallback("player_death", "killmsg_main");

function killmsg_hurt() {
  if (
    Entity.GetLocalPlayer() == Entity.GetEntityFromUserID(Event.GetInt("attacker")) &&
    Entity.GetLocalPlayer() != Entity.GetEntityFromUserID(Event.GetInt("userid"))
  ) {
    if (!shots[Event.GetInt("userid")]) shots[Event.GetInt("userid")] = 0;
    shots[Event.GetInt("userid")] += 1;
  }
}
Cheat.RegisterCallback("player_hurt", "killmsg_hurt");

// Mindmg override

function mindmg_main() {
  if (
    UI.GetValue([
      "Config",
      "SUBTAB_MGR",
      "Scripts",
      "SHEET_MGR",
      "Keys",
      "JS Keybinds",
      "[skid.js] Min damage override",
    ])
  ) {
    const tabName = jsName + " - Min. dmg",
      dmg = UI.GetValue(["Config", tabName, tabName, "Minimum damage"]),
      enemies = Entity.GetEnemies();

    for (enemy in enemies) {
      Ragebot.ForceTargetMinimumDamage(enemies[enemy], dmg || 1);
    }
  }
}
Cheat.RegisterCallback("CreateMove", "mindmg_main");

// Kill sound

var KS = {
  playing: false,
  started: 0.0,
};

function killsound_main() {
  const tabName = jsName + " - Kill sound";
  if (!UI.GetValue(["Config", tabName, tabName, "Enable"])) return;

  if (
    Entity.GetLocalPlayer() == Entity.GetEntityFromUserID(Event.GetInt("attacker")) &&
    Entity.GetLocalPlayer() != Entity.GetEntityFromUserID(Event.GetInt("userid"))
  ) {
    KS.started = Global.Realtime();
    KS.playing = true;
    if (UI.GetValue(["Config", tabName, tabName, "Playback"])) Global.ExecuteCommand("voice_loopback 1");
    Sound.PlayMicrophone("..\\Counter-Strike Global Offensive\\" + killsound_getRandomSound());
  }
}

function killsound_reset() {
  const tabName = jsName + " - Kill sound";

  if (
    KS.playing &&
    KS.started + UI.GetValue(["Config", tabName, tabName, "Sound length (in sec)"]) - Global.Realtime() < 0.05
  ) {
    KS.playing = false;
    Sound.StopMicrophone();
    Global.ExecuteCommand("voice_loopback 0");
  }
}

function killsound_getRandomSound() {
  var tabName = jsName + " - Kill sound",
    str = UI.GetString(["Config", tabName, tabName, "Sound(s) (Separate file names with +)"]),
    sounds = str.split("+"),
    sound = sounds[Math.floor(Math.random() * sounds.length)];

  Cheat.Print(str);
  Cheat.Print(sound);

  return sound + ".wav";
}

Cheat.RegisterCallback("player_death", "killsound_main");
Global.RegisterCallback("FrameStageNotify", "killsound_reset");
