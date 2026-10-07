import type { UnitTypeId } from "./types";

export const UNIT_SPRITE_CLASSES: Record<UnitTypeId, string> = {
  swordsman: "swordsmanSprite",
  dual_swordsman: "doubleSwordSprite",
  magic_swordsman: "magicSwordSprite",
  fire_mage: "fireMagicianSprite",
  ice_mage: "iceMagicianSprite",
  lightning_mage: "thunderMagicianSprite",
  rifleman: "riflemanSprite",
  shotgunner: "shotgunnerSprite",
  sniper: "sniperSprite",
};

export const UNIT_EFFECT_CLASSES: Record<UnitTypeId, string> = {
  swordsman: "swordsmanEffect",
  dual_swordsman: "doubleSwordEffect",
  magic_swordsman: "magicSwordEffect",
  fire_mage: "fireMagicianEffect",
  ice_mage: "iceMagicianEffect",
  lightning_mage: "thunderMagicianEffect",
  rifleman: "riflemanEffect",
  shotgunner: "shotgunnerEffect",
  sniper: "sniperEffect",
};

export const UNIT_PORTRAIT_CLASSES: Record<UnitTypeId, string> = {
  swordsman: "swordsmanPortrait",
  dual_swordsman: "doubleSwordPortrait",
  magic_swordsman: "magicSwordPortrait",
  fire_mage: "fireMagicianPortrait",
  ice_mage: "iceMagicianPortrait",
  lightning_mage: "thunderMagicianPortrait",
  rifleman: "riflemanPortrait",
  shotgunner: "shotgunnerPortrait",
  sniper: "sniperPortrait",
};

export const UNIT_TIER2_SKILL_ICONS: Record<UnitTypeId, string> = {
  swordsman: new URL("../../images/tier2-skill-icon-swordsman.png", import.meta.url).href,
  dual_swordsman: new URL("../../images/tier2-skill-icon-dual_swordsman.png", import.meta.url).href,
  magic_swordsman: new URL("../../images/tier2-skill-icon-magic_swordsman.png", import.meta.url).href,
  fire_mage: new URL("../../images/tier2-skill-icon-fire_mage.png", import.meta.url).href,
  ice_mage: new URL("../../images/tier2-skill-icon-ice_mage.png", import.meta.url).href,
  lightning_mage: new URL("../../images/tier2-skill-icon-lightning_mage.png", import.meta.url).href,
  rifleman: new URL("../../images/tier2-skill-icon-rifleman.png", import.meta.url).href,
  shotgunner: new URL("../../images/tier2-skill-icon-shotgunner.png", import.meta.url).href,
  sniper: new URL("../../images/tier2-skill-icon-sniper.png", import.meta.url).href,
};
