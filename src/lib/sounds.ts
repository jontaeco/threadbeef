"use client";

import { Howl } from "howler";

const sounds: Record<string, Howl> = {};

function getSound(name: string): Howl {
  if (!sounds[name]) {
    sounds[name] = new Howl({
      src: [`/sounds/${name}.mp3`],
      volume: 0.5,
      preload: true,
    });
  }
  return sounds[name];
}

export function playSizzle() {
  getSound("sizzle").play();
}

export function playGavel() {
  getSound("gavel").play();
}

export function playCrowd() {
  getSound("crowd").play();
}
