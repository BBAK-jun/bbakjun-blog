"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.tsx
var index_exports = {};
__export(index_exports, {
  Avatar: () => import_react_avatar.Avatar,
  Separator: () => import_react_separator.Separator,
  Slot: () => import_react_slot.Slot,
  clsx: () => import_clsx2.clsx,
  cn: () => cn,
  cva: () => import_class_variance_authority.cva,
  twMerge: () => import_tailwind_merge2.twMerge,
  uuidv4: () => import_uuid.v4
});
module.exports = __toCommonJS(index_exports);

// src/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");
function cn(...inputs) {
  return (0, import_tailwind_merge.twMerge)((0, import_clsx.clsx)(inputs));
}

// src/index.tsx
var import_react_avatar = require("@radix-ui/react-avatar");
var import_react_separator = require("@radix-ui/react-separator");
var import_react_slot = require("@radix-ui/react-slot");
var import_class_variance_authority = require("class-variance-authority");
var import_clsx2 = require("clsx");
__reExport(index_exports, require("lucide-react"), module.exports);
var import_tailwind_merge2 = require("tailwind-merge");
var import_uuid = require("uuid");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Avatar,
  Separator,
  Slot,
  clsx,
  cn,
  cva,
  twMerge,
  uuidv4,
  ...require("lucide-react")
});
