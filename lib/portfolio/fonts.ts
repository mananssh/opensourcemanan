import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

/** Portfolio fonts — shared so the layout AND portaled UI (the detail modal,
 *  which renders outside the layout tree) can apply the same theme scope. */
const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});
const body = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/** The font-variable classes. */
export const portfolioFontVars = `${display.variable} ${body.variable} ${mono.variable}`;
/** Full theme scope = vertical tokens + fonts (for portaled content). */
export const portfolioScope = `vertical-portfolio ${portfolioFontVars}`;
