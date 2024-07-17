import * as artnetModule from "artnet";
import { broadcast } from "./web";

const ARTNET_OPTIONS = {
  // host: "192.168.8.116",
  host: "192.168.1.42",
  sendAll: true,
  refresh: 60,
};

const UNIVERSEMAPPING = [
  {
    universe: 0,
    channeloffset: 1,
    firstled: 0,
    reversefirstled: undefined,
    leds: 170,
    reversed: false,
  },
  {
    universe: 1,
    channeloffset: 1,
    firstled: 0 + 170,
    reversefirstled: undefined,
    leds: 170,
    reversed: false,
  },
  {
    universe: 2,
    channeloffset: 1,
    firstled: 0 + 340,
    reversefirstled: undefined,
    leds: 60,
    reversed: false,
  },

  {
    universe: 5,
    channeloffset: 1,
    firstled: undefined,
    reversefirstled: 799,
    leds: 170,
    reversed: true,
  },
  {
    universe: 6,
    channeloffset: 1,
    firstled: undefined,
    reversefirstled: 799 - 170,
    leds: 170,
    reversed: true,
  },
  {
    universe: 7,
    channeloffset: 1,
    firstled: undefined,
    reversefirstled: 799 - 340,
    leds: 60,
    reversed: true,
  },

  //   {
  //     universe: 9,
  //     channeloffset: 2,
  //     firstled: 170,
  //     leds: 170,
  //   },
  //   {
  //     universe: 16,
  //     channeloffset: 1,
  //     firstled: 0,
  //     leds: 170,
  //   },
  //   {
  //     universe: 17,
  //     channeloffset: 2,
  //     firstled: 170,
  //     leds: 170,
  //   },
  //   {
  //     universe: 24,
  //     channeloffset: 1,
  //     firstled: 0,
  //     leds: 170,
  //   },
  //   {
  //     universe: 25,
  //     channeloffset: 2,
  //     firstled: 170,
  //     leds: 170,
  //   },
];

export let ledbuffer = [];

export let artnetbuffers = [];

const artnet = artnetModule(ARTNET_OPTIONS);

// function parse(cstr) {
//   var parts = [];
//   var base = cstr.slice(1);
//   var size = base.length;
//   var isShort = size <= 4;

//   if (isShort) {
//     parts = [
//       parseInt(base[0] + base[0], 16),
//       parseInt(base[1] + base[1], 16),
//       parseInt(base[2] + base[2], 16),
//     ];
//   } else {
//     parts = [
//       parseInt(base[0] + base[1], 16),
//       parseInt(base[2] + base[3], 16),
//       parseInt(base[4] + base[5], 16),
//     ];
//   }

//   if (!parts[0]) parts[0] = 0;
//   if (!parts[1]) parts[1] = 0;
//   if (!parts[2]) parts[2] = 0;

//   return parts;
// }

export function blitArtNet(showGrid: boolean) {
  for (const unimap of UNIVERSEMAPPING) {
    const buffer = new Uint8Array(unimap.leds * 3);

    for (var k = 0; k < unimap.leds; k++) {
      if (unimap.reversed) {
        const color = ledbuffer[unimap.reversefirstled - k];
        if (color) {
          buffer[k * 3 + 0] = color[0];
          buffer[k * 3 + 1] = color[1];
          buffer[k * 3 + 2] = color[2];
        }
      } else {
        const color = ledbuffer[unimap.firstled + k];
        if (color) {
          buffer[k * 3 + 0] = color[0];
          buffer[k * 3 + 1] = color[1];
          buffer[k * 3 + 2] = color[2];
        }
      }

      if (showGrid) {
        if (k % 10 === 0) {
          buffer[k * 3 + 0] = 50;
          buffer[k * 3 + 1] = 50;
          buffer[k * 3 + 2] = 50;
        }

        if (k % 50 === 0) {
          buffer[k * 3 + 0] = 255;
          buffer[k * 3 + 1] = 0;
          buffer[k * 3 + 2] = 0;
        }

        if (k % 50 === 1) {
          buffer[k * 3 + 0] = 0;
          buffer[k * 3 + 1] = 255;
          buffer[k * 3 + 2] = 0;
        }

        if (k % 50 === 2) {
          buffer[k * 3 + 0] = 0;
          buffer[k * 3 + 1] = 0;
          buffer[k * 3 + 2] = 255;
        }
      }
    }

    artnetbuffers[unimap.universe] = Array.from(buffer);

    artnet.set(
      unimap.universe,
      unimap.channeloffset,
      buffer,
      function (err, res) {
        if (err) {
          console.log("err " + JSON.stringify(err));
        }
      }
    );
  }
}

export function initArtNet() {
  // setInterval(blit, 10);
}
