#!/usr/bin/env python3
"""Generate one lightweight, product-specific SVG illustration for each catalog item."""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src/data/catalog.json"
OUT = ROOT / "public/images/catalog"


def palette(product):
    name = product["name"].lower()
    if "دیوالت" in name or "dewalt" in name:
        return {"accent": "#e7b91f", "accent2": "#ffcf35", "dark": "#242a30"}
    if "ماکیتا" in name or "makita" in name:
        return {"accent": "#17864a", "accent2": "#54b46b", "dark": "#26342e"}
    if "رونیکس" in name or "ronix" in name:
        return {"accent": "#ed572f", "accent2": "#ff8a42", "dark": "#282b30"}
    if "سندوی" in name:
        return {"accent": "#62a64a", "accent2": "#95cb61", "dark": "#29332d"}
    if "پنتاکس" in name:
        return {"accent": "#d9a321", "accent2": "#f1c84d", "dark": "#303438"}
    if "سوکیا" in name:
        return {"accent": "#3c7755", "accent2": "#79a975", "dark": "#29342f"}
    if "wild" in name or "ویلد" in name:
        return {"accent": "#536b53", "accent2": "#849a73", "dark": "#252b27"}
    return {"accent": "#ed762c", "accent2": "#ffad50", "dark": "#2c333b"}


def drawing(visual, p):
    a, a2, dark = p["accent"], p["accent2"], p["dark"]
    if visual == "total-station":
        return f'''<g filter="url(#shadow)">
 <path d="M315 570 270 635h260l-45-65z" fill="url(#metal)" stroke="#606a76" stroke-width="8"/>
 <ellipse cx="400" cy="633" rx="142" ry="24" fill="#343b43"/><ellipse cx="400" cy="625" rx="111" ry="18" fill="url(#metal)"/>
 <path d="M315 598h170l-24 37H339z" fill="#424952"/><circle cx="330" cy="609" r="18" fill="#24292f"/><circle cx="470" cy="609" r="18" fill="#24292f"/>
 <path d="M305 230q0-45 43-45h104q43 0 43 45v330q0 35-36 42H341q-36-7-36-42z" fill="#454c54" stroke="#69717b" stroke-width="8"/>
 <path d="M307 236q0-45 27-49v328q0 25 12 45l-23 45q-16-10-16-43z" fill="{a}"/>
 <path d="M493 236q0-45-27-49v328q0 25-12 45l23 45q16-10 16-43z" fill="{a}"/>
 <path d="M326 208q8-36 39-36h70q31 0 39 36v42H326z" fill="#525b65"/>
 <path d="M344 173q4-78 56-78t56 78" fill="none" stroke="#343b43" stroke-width="25" stroke-linecap="round"/>
 <path d="M347 171q6-63 53-63t53 63" fill="none" stroke="#858d95" stroke-width="10" stroke-linecap="round"/>
 <rect x="331" y="244" width="138" height="157" rx="26" fill="#363c43" stroke="#818993" stroke-width="8"/>
 <circle cx="400" cy="321" r="54" fill="#20252b" stroke="#aab3bc" stroke-width="7"/><circle cx="400" cy="321" r="41" fill="url(#lens)"/><circle cx="400" cy="321" r="24" fill="#10191e" stroke="#7193a7" stroke-width="5"/><circle cx="400" cy="321" r="10" fill="#60a5bd" opacity=".8"/>
 <rect x="322" y="425" width="156" height="107" rx="12" fill="#262c32" stroke="#78828e" stroke-width="7"/><rect x="337" y="438" width="91" height="62" rx="7" fill="url(#screen)"/>
 <path d="M345 488h75" stroke="#c5d7df" stroke-width="3" opacity=".6"/>
 <g fill="{a2}" stroke="#30363d" stroke-width="4">{''.join(f'<circle cx="{x}" cy="{y}" r="11"/>' for x,y in [(449,448),(449,480),(449,512),(389,515),(351,515)])}</g>
 <circle cx="280" cy="439" r="28" fill="#30363c" stroke="#9199a1" stroke-width="8"/><circle cx="280" cy="439" r="15" fill="#69737d"/>
 <circle cx="520" cy="470" r="27" fill="#30363c" stroke="#9199a1" stroke-width="8"/><circle cx="520" cy="470" r="14" fill="#69737d"/>
 <path d="M351 558h98v26q-48 23-98 0z" fill="#252b30"/><circle cx="365" cy="574" r="9" fill="{a2}"/><circle cx="435" cy="574" r="9" fill="{a2}"/>
 </g>'''
    if visual == "laser-level":
        beam = "#2bd177" if a in ("#17864a", "#54b46b", "#62a64a", "#95cb61") else "#ef4d3f"
        return f'''<g opacity=".2" filter="url(#beam)"><path d="M400 235v370M205 420h390" stroke="{beam}" stroke-width="18"/></g>
 <g filter="url(#shadow)">
 <ellipse cx="400" cy="644" rx="160" ry="25" fill="#aeb9c5" opacity=".5"/>
 <path d="M302 555 330 605h140l28-50-29-27h-138z" fill="#404750" stroke="#242b32" stroke-width="8"/><ellipse cx="400" cy="597" rx="86" ry="18" fill="#303840"/>
 <rect x="283" y="272" width="234" height="288" rx="44" fill="{dark}" stroke="#151a20" stroke-width="10"/>
 <path d="M302 313q0-27 27-27h142q27 0 27 27v204q0 20-19 20H321q-19 0-19-20z" fill="{a}"/>
 <path d="M318 331h164v171H318z" fill="#20272d" stroke="#747e88" stroke-width="6"/>
 <rect x="337" y="350" width="126" height="116" rx="26" fill="#353d46"/><circle cx="400" cy="407" r="44" fill="#111a20" stroke="{a2}" stroke-width="8"/><circle cx="400" cy="407" r="24" fill="url(#lens)"/><circle cx="400" cy="407" r="9" fill="{beam}" opacity=".8"/>
 <path d="M336 480h128" stroke="{beam}" stroke-width="5" opacity=".85"/><path d="M400 352v111" stroke="{beam}" stroke-width="4" opacity=".7"/>
 <rect x="360" y="301" width="80" height="21" rx="10" fill="#171c21"/><circle cx="400" cy="300" r="31" fill="#333b44" stroke="#7b8791" stroke-width="6"/><circle cx="400" cy="300" r="15" fill="{a2}"/>
 <path d="M296 321v185m208-185v185" stroke="{a2}" stroke-width="13" stroke-linecap="round" opacity=".8"/>
 <circle cx="400" cy="535" r="10" fill="#d8e1e8"/><rect x="341" y="530" width="118" height="18" rx="9" fill="#303840"/>
 </g>'''
    if visual == "battery":
        return f'''<g filter="url(#shadow)">
 <path d="M322 251h156l24 50v282q0 35-35 35H333q-35 0-35-35V301z" fill="url(#darkgrad)" stroke="#252c33" stroke-width="9"/>
 <path d="M321 319h158v205H321z" fill="{a}"/><path d="M340 332h120v179H340z" fill="#f5f7fa" stroke="#cbd3dc" stroke-width="5"/>
 <path d="M358 287h84v-30h-84z" fill="#252b31"/><rect x="369" y="228" width="22" height="48" rx="5" fill="#b1bbc5"/><rect x="409" y="228" width="22" height="48" rx="5" fill="#b1bbc5"/>
 <rect x="350" y="355" width="100" height="12" rx="6" fill="{a}"/><rect x="350" y="382" width="78" height="8" rx="4" fill="#8c99a6"/><rect x="350" y="403" width="90" height="8" rx="4" fill="#b1bbc4"/>
 <circle cx="400" cy="463" r="25" fill="#eef4f7" stroke="#9eabb7" stroke-width="6"/><path d="m390 463 8 8 16-19" fill="none" stroke="{a}" stroke-width="7" stroke-linecap="round"/>
 <path d="M300 322h-14v185h14m200-185h14v185h-14" fill="none" stroke="#89939d" stroke-width="7"/>
 </g>'''
    if visual == "charger":
        return f'''<g filter="url(#shadow)">
 <path d="M264 493q0-34 36-34h200q36 0 36 34v91q0 29-31 29H295q-31 0-31-29z" fill="#303840" stroke="#1c2329" stroke-width="9"/>
 <path d="M300 485v-100q0-25 28-25h144q28 0 28 25v100" fill="none" stroke="#59636d" stroke-width="14"/>
 <rect x="303" y="341" width="194" height="151" rx="25" fill="{dark}" stroke="{a}" stroke-width="10"/>
 <rect x="329" y="369" width="142" height="72" rx="11" fill="url(#screen)"/><path d="M346 414h64" stroke="#79b9c5" stroke-width="5"/><circle cx="443" cy="405" r="11" fill="{a2}"/>
 <g fill="#d4dce4"><rect x="344" y="319" width="26" height="26" rx="4"/><rect x="430" y="319" width="26" height="26" rx="4"/></g>
 <path d="M294 548h212" stroke="#77838e" stroke-width="6" opacity=".7"/><circle cx="320" cy="555" r="7" fill="{a2}"/><circle cx="480" cy="555" r="7" fill="#46d19b"/>
 </g>'''
    if visual == "bag":
        return f'''<g filter="url(#shadow)">
 <path d="M238 366q0-36 38-44l35-106q8-23 35-23h109q27 0 35 23l35 106q38 8 38 44v200q0 39-40 39H278q-40 0-40-39z" fill="#343a40" stroke="#20262c" stroke-width="10"/>
 <path d="M337 239q3-49 63-49t63 49" fill="none" stroke="#20262c" stroke-width="23" stroke-linecap="round"/><path d="M341 236q4-31 59-31t59 31" fill="none" stroke="#767f86" stroke-width="7"/>
 <path d="M252 376h296v36H252z" fill="{a}"/><path d="M258 431h284v8H258z" fill="#a5adb4" opacity=".8"/>
 <path d="M266 443h119v110H266z" fill="#424a51" stroke="#646d76" stroke-width="6"/><path d="M401 443h127v110H401z" fill="#3f464e" stroke="#646d76" stroke-width="6"/>
 <rect x="294" y="470" width="59" height="48" rx="12" fill="#20272d"/><path d="M300 490h46" stroke="{a2}" stroke-width="5"/>
 <path d="M250 584h288" stroke="#69727b" stroke-width="8"/><circle cx="279" cy="605" r="9" fill="{a2}"/><circle cx="509" cy="605" r="9" fill="{a2}"/>
 </g>'''
    if visual == "handle":
        return f'''<g filter="url(#shadow)">
 <path d="M261 536h278v57H261z" rx="15" fill="#454d56" stroke="#22282f" stroke-width="9"/><path d="M278 546h244v18H278z" fill="{a}"/>
 <path d="M316 536V299q0-60 61-60h47q61 0 61 60v237" fill="none" stroke="#59636e" stroke-width="35" stroke-linecap="round"/>
 <path d="M316 516V300q0-42 47-42h75q47 0 47 42v216" fill="none" stroke="url(#metal)" stroke-width="17" stroke-linecap="round"/>
 <path d="M356 246h88" stroke="#252c32" stroke-width="28" stroke-linecap="round"/><rect x="359" y="228" width="82" height="37" rx="17" fill="{dark}"/>
 <circle cx="290" cy="570" r="12" fill="#c5cdd4"/><circle cx="510" cy="570" r="12" fill="#c5cdd4"/>
 </g>'''
    if visual == "tape-measure":
        return f'''<g filter="url(#shadow)">
 <circle cx="385" cy="418" r="170" fill="#252b31" stroke="#13191f" stroke-width="13"/><circle cx="385" cy="418" r="138" fill="{a}"/><circle cx="385" cy="418" r="107" fill="#f4f6f8" stroke="#b9c2ca" stroke-width="7"/>
 <circle cx="385" cy="418" r="82" fill="#f8fafb" stroke="#343a40" stroke-width="16"/><circle cx="385" cy="418" r="21" fill="#4a525a"/>
 <g stroke="#394047" stroke-width="5">{''.join(f'<path d="M385 327v19" transform="rotate({i*30} 385 418)"/>' for i in range(12))}</g>
 <path d="M510 474q137 5 153 71v38q0 28-29 28H479" fill="none" stroke="#f4f6f8" stroke-width="32"/><path d="M514 475q128 7 149 73" fill="none" stroke="{a}" stroke-width="9"/>
 <path d="M638 580h45" stroke="{a}" stroke-width="17"/><circle cx="385" cy="418" r="30" fill="#303840"/><circle cx="385" cy="418" r="12" fill="{a2}"/>
 </g>'''
    if visual == "laser-meter":
        return f'''<g filter="url(#shadow)">
 <path d="M323 173q0-35 39-35h85q39 0 39 35v438q0 39-39 39h-85q-39 0-39-39z" fill="{dark}" stroke="#151b20" stroke-width="10"/>
 <path d="M331 186q0-32 31-32h25v491h-26q-30 0-30-33z" fill="{a}"/><path d="M478 186q0-32-31-32h-25v491h26q30 0 30-33z" fill="{a}"/>
 <rect x="354" y="200" width="100" height="154" rx="12" fill="#cde5ec" stroke="#8aa2ad" stroke-width="8"/><path d="M369 247h64M369 281h50M369 316h37" stroke="#42616b" stroke-width="6" stroke-linecap="round"/>
 <circle cx="404" cy="405" r="32" fill="{a2}" stroke="#242a30" stroke-width="8"/><circle cx="404" cy="405" r="12" fill="#f8fbfc"/>
 <g fill="#303840" stroke="#909aa3" stroke-width="5"><rect x="354" y="460" width="42" height="42" rx="12"/><rect x="412" y="460" width="42" height="42" rx="12"/><rect x="354" y="515" width="42" height="42" rx="12"/><rect x="412" y="515" width="42" height="42" rx="12"/></g>
 <path d="M345 591h133" stroke="#22282e" stroke-width="8"/>
 </g>'''
    if visual == "pocket-tape":
        return f'''<g filter="url(#shadow)">
 <path d="M288 292q0-38 40-38h143q40 0 40 38v218q0 45-43 45h-137q-43 0-43-45z" fill="{a}" stroke="#343b42" stroke-width="13"/>
 <path d="M303 314q0-24 26-24h139q26 0 26 24v126H303z" fill="#f2c436"/><path d="M318 339h159" stroke="#333a40" stroke-width="9"/>
 <path d="M318 371h136M318 401h120" stroke="#434a50" stroke-width="5"/>
 <circle cx="399" cy="510" r="41" fill="#282f36" stroke="#b9c2ca" stroke-width="8"/><circle cx="399" cy="510" r="14" fill="{a2}"/>
 <path d="M353 241h109" stroke="#252b31" stroke-width="25" stroke-linecap="round"/><rect x="376" y="223" width="70" height="39" rx="17" fill="#282f36"/>
 <path d="M487 344h23" stroke="#fff4b0" stroke-width="8"/>
 </g>'''
    if visual == "wheel-meter":
        return f'''<g filter="url(#shadow)">
 <path d="M390 440 493 167q16-40 52-22l32 17q32 17 16 49L493 489" fill="none" stroke="#323941" stroke-width="24" stroke-linecap="round"/>
 <path d="M520 160h83v-25h-83z" fill="#343b43"/><rect x="522" y="111" width="124" height="66" rx="14" fill="{a}" stroke="#272e35" stroke-width="8"/><rect x="541" y="125" width="84" height="27" rx="5" fill="#d7eef0"/>
 <circle cx="373" cy="482" r="157" fill="#f0f3f5" stroke="#333a42" stroke-width="25"/><circle cx="373" cy="482" r="119" fill="#e4e9ed" stroke="{a}" stroke-width="15"/>
 <g stroke="#59636d" stroke-width="15" stroke-linecap="round">{''.join(f'<path d="M373 482 373 {383+i*0}" transform="rotate({i*45} 373 482)"/>' for i in range(8))}</g>
 <circle cx="373" cy="482" r="33" fill="#303840"/><circle cx="373" cy="482" r="12" fill="{a2}"/>
 <path d="M448 612l41 29" stroke="#333a42" stroke-width="18"/><rect x="473" y="629" width="75" height="25" rx="12" fill="#323941"/>
 </g>'''
    if visual == "eyepiece":
        return f'''<g filter="url(#shadow)" transform="rotate(-31 400 400)">
 <path d="M283 324q0-35 39-35h147q39 0 39 35v161q0 36-39 36H322q-39 0-39-36z" fill="#333a42" stroke="#1b2127" stroke-width="10"/>
 <rect x="297" y="342" width="196" height="30" rx="10" fill="{a}"/><path d="M299 417h192" stroke="#5d6872" stroke-width="18"/>
 <path d="M309 338h-70q-30 0-30 30v73q0 30 30 30h70" fill="#22282e" stroke="#79848e" stroke-width="8"/><ellipse cx="234" cy="405" rx="26" ry="50" fill="#1b2228" stroke="#adb7c0" stroke-width="8"/><ellipse cx="234" cy="405" rx="14" ry="33" fill="url(#lens)"/>
 <path d="M494 347h52q29 0 29 28v60q0 29-29 29h-52" fill="#293139" stroke="#7b858d" stroke-width="8"/><ellipse cx="566" cy="405" rx="18" ry="33" fill="#1b2228" stroke="#a8b2bb" stroke-width="7"/><ellipse cx="566" cy="405" rx="9" ry="23" fill="url(#lens)"/>
 <path d="M336 290h111" stroke="#89939c" stroke-width="10"/>
 </g>'''
    if visual == "case":
        return f'''<g filter="url(#shadow)">
 <path d="M230 310q0-46 47-46h246q47 0 47 46v274q0 43-46 43H276q-46 0-46-43z" fill="#30373f" stroke="#171d23" stroke-width="12"/>
 <path d="M244 344h312v188H244z" fill="#3b444d" stroke="#707a83" stroke-width="7"/>
 <path d="M258 359v151m283-151v151" stroke="#242a30" stroke-width="13"/>
 <path d="M337 262v-28q0-38 36-38h53q36 0 36 38v28" fill="none" stroke="#232a30" stroke-width="23" stroke-linecap="round"/><path d="M341 260v-22q0-25 30-25h56q30 0 30 25v22" fill="none" stroke="#8c969f" stroke-width="8"/>
 <g fill="{a}" stroke="#151b20" stroke-width="5"><rect x="281" y="541" width="55" height="56" rx="10"/><rect x="461" y="541" width="55" height="56" rx="10"/></g>
 <path d="M362 397h96" stroke="#8c969f" stroke-width="6" opacity=".65"/><circle cx="400" cy="439" r="16" fill="{a2}"/>
 </g>'''
    if visual in ("tripod-wood", "tripod-aluminum"):
        wood = visual == "tripod-wood"
        leg = "url(#wood)" if wood else "url(#metal)"
        edge = "#65492f" if wood else "#68747f"
        return f'''<g filter="url(#shadow)">
 <path d="M342 161q0-18 19-18h78q19 0 19 18v53H342z" fill="#252c33" stroke="#151b20" stroke-width="8"/><ellipse cx="400" cy="150" rx="62" ry="19" fill="#505a64"/>
 <path d="M359 194 211 654q-10 31 15 39l25 7q22 6 30-20l119-384 119 384q8 26 30 20l25-7q25-8 15-39L442 194z" fill="{leg}" stroke="{edge}" stroke-width="10" stroke-linejoin="round"/>
 <path d="M388 204 382 665q0 28 21 29t22-29l-13-461" fill="{leg}" stroke="{edge}" stroke-width="9"/>
 <path d="M290 425h67m86 0h67M272 492h76m104 0h76" stroke="#252c33" stroke-width="18" stroke-linecap="round"/>
 <path d="M307 436h48m86 0h48M291 503h51m116 0h51" stroke="{a}" stroke-width="8" stroke-linecap="round"/>
 <path d="M225 672l-15 36q-5 13 10 13h30q13 0 9-14l-8-30m386-5 15 36q5 13-10 13h-30q-13 0-9-14l8-30" fill="#252b31"/>
 <path d="M399 651v41" stroke="{a2}" stroke-width="8"/>
 </g>'''
    if visual == "theodolite":
        return f'''<g filter="url(#shadow)">
 <path d="M297 519h206l34 87H263z" fill="#333a42" stroke="#20262d" stroke-width="8"/><ellipse cx="400" cy="593" rx="136" ry="20" fill="#252c32"/>
 <path d="M327 498v-31h146v31l-19 39h-108z" fill="url(#metal)" stroke="#656f78" stroke-width="8"/>
 <path d="M323 289q0-45 45-45h64q45 0 45 45v176H323z" fill="#4d565e" stroke="#282f36" stroke-width="10"/>
 <path d="M291 313q0-45 42-45h134q42 0 42 45v62H291z" fill="{a}" stroke="#333a42" stroke-width="10"/>
 <path d="M266 311h268v67H266z" fill="#353d45" stroke="#242a30" stroke-width="10"/>
 <ellipse cx="269" cy="344" rx="28" ry="43" fill="#20262c" stroke="#98a3ad" stroke-width="8"/><ellipse cx="269" cy="344" rx="15" ry="28" fill="url(#lens)"/>
 <ellipse cx="531" cy="344" rx="28" ry="43" fill="#20262c" stroke="#98a3ad" stroke-width="8"/><ellipse cx="531" cy="344" rx="15" ry="28" fill="url(#lens)"/>
 <path d="M332 248q68-74 136 0" fill="none" stroke="#272e35" stroke-width="20" stroke-linecap="round"/>
 <circle cx="500" cy="427" r="28" fill="#252b31" stroke="#8d979f" stroke-width="7"/><circle cx="500" cy="427" r="12" fill="{a2}"/>
 <circle cx="344" cy="482" r="11" fill="{a}"/><circle cx="456" cy="482" r="11" fill="{a}"/>
 <path d="M312 549h176" stroke="#929da6" stroke-width="7" opacity=".55"/>
 </g>'''
    if visual == "auto-level":
        return f'''<g filter="url(#shadow)">
 <path d="M267 443h267l33 138H234z" fill="#373f46" stroke="#20272d" stroke-width="10"/><ellipse cx="400" cy="571" rx="146" ry="21" fill="#252b31"/>
 <path d="M244 320q0-50 52-50h208q52 0 52 50v101q0 46-48 46H292q-48 0-48-46z" fill="{a}" stroke="#343b42" stroke-width="9"/>
 <path d="M253 331h283v66H253z" fill="#303840" stroke="#20272d" stroke-width="8"/>
 <ellipse cx="253" cy="364" rx="31" ry="43" fill="#20262b" stroke="#9ca7b0" stroke-width="8"/><ellipse cx="253" cy="364" rx="17" ry="29" fill="url(#lens)"/>
 <ellipse cx="537" cy="364" rx="26" ry="38" fill="#252b31" stroke="#87929c" stroke-width="7"/>
 <path d="M306 279q94-68 188 0" fill="none" stroke="#252b31" stroke-width="17" stroke-linecap="round"/>
 <circle cx="408" cy="442" r="34" fill="#303840" stroke="#96a1aa" stroke-width="8"/><circle cx="408" cy="442" r="13" fill="{a2}"/>
 <circle cx="333" cy="505" r="21" fill="#252b31" stroke="#abb5be" stroke-width="7"/><circle cx="467" cy="505" r="21" fill="#252b31" stroke="#abb5be" stroke-width="7"/>
 <path d="M300 534h200" stroke="#89949e" stroke-width="6"/>
 </g>'''
    if visual == "spirit-level":
        return f'''<g filter="url(#shadow)" transform="rotate(-7 400 410)">
 <path d="M126 345q0-23 26-23h496q26 0 26 23v131q0 23-26 23H152q-26 0-26-23z" fill="{a}" stroke="#343a40" stroke-width="12"/>
 <path d="M150 367h472v88H150z" fill="#f0c83b" stroke="#b58c14" stroke-width="7"/>
 <rect x="208" y="382" width="98" height="58" rx="29" fill="#26323b" stroke="#b9c6cf" stroke-width="6"/><rect x="502" y="382" width="98" height="58" rx="29" fill="#26323b" stroke="#b9c6cf" stroke-width="6"/>
 <ellipse cx="257" cy="411" rx="20" ry="13" fill="#b9edb8"/><ellipse cx="551" cy="411" rx="20" ry="13" fill="#b9edb8"/>
 <path d="M388 383v57m24-57v57" stroke="#3f464b" stroke-width="5"/>
 <circle cx="400" cy="411" r="28" fill="#27313a" stroke="#c2ccd3" stroke-width="6"/><ellipse cx="400" cy="411" rx="12" ry="8" fill="#b7e7aa"/>
 </g>'''
    return '''<g filter="url(#shadow)"><rect x="280" y="260" width="240" height="300" rx="34" fill="#424b54"/><circle cx="400" cy="380" r="75" fill="url(#lens)"/></g>'''


def svg_for(product):
    p = palette(product)
    code = product["code"]
    title = html.escape(product["model"])
    illustration = drawing(product["visual"], p)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-labelledby="title desc">
<title id="title">{html.escape(product['name'])}</title><desc id="desc">تصویر گرافیکی اختصاصی {html.escape(product['name'])} با تم سفید فروشگاه نقشیران</desc>
<defs>
 <linearGradient id="stage" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".72" stop-color="#f8fafc"/><stop offset="1" stop-color="#edf2f6"/></linearGradient>
 <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#e7ebef"/><stop offset=".28" stop-color="#aeb7c0"/><stop offset=".55" stop-color="#f8fafb"/><stop offset=".8" stop-color="#87929c"/><stop offset="1" stop-color="#d7dde2"/></linearGradient>
 <linearGradient id="darkgrad" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#5a626a"/><stop offset=".45" stop-color="#333a42"/><stop offset="1" stop-color="#1e242a"/></linearGradient>
 <linearGradient id="wood" x1="0" x2="1"><stop stop-color="#80572f"/><stop offset=".2" stop-color="#d1a36a"/><stop offset=".42" stop-color="#95643a"/><stop offset=".62" stop-color="#d4a66c"/><stop offset="1" stop-color="#76502f"/></linearGradient>
 <radialGradient id="lens" cx=".35" cy=".25"><stop stop-color="#a8d1dc"/><stop offset=".24" stop-color="#476f82"/><stop offset=".6" stop-color="#182e3a"/><stop offset="1" stop-color="#090f14"/></radialGradient>
 <linearGradient id="screen" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#eaf3f4"/><stop offset="1" stop-color="#a8c2cb"/></linearGradient>
 <filter id="shadow" x="-35%" y="-25%" width="170%" height="170%"><feDropShadow dx="0" dy="22" stdDeviation="18" flood-color="#233648" flood-opacity=".28"/></filter>
 <filter id="beam" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>
 <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" fill="none" stroke="#b8c7d5" stroke-opacity=".13" stroke-width="1"/></pattern>
</defs>
<rect width="800" height="800" fill="url(#stage)"/><rect width="800" height="800" fill="url(#grid)"/>
<circle cx="405" cy="395" r="290" fill="#fff" opacity=".52"/><circle cx="400" cy="406" r="283" fill="none" stroke="#e3e9ef" stroke-width="2" stroke-dasharray="3 13"/>
<path d="M96 618c140-37 460-38 608 0" fill="none" stroke="{p['accent']}" stroke-opacity=".12" stroke-width="3"/>
<ellipse cx="400" cy="667" rx="230" ry="30" fill="#697b8e" opacity=".09"/>
{illustration}
<g font-family="Arial, sans-serif"><text x="48" y="63" fill="#82909e" font-size="17" font-weight="700" letter-spacing="3">NAGHSHIRAN  /  SURVEY EQUIPMENT</text><path d="M48 82h90" stroke="{p['accent']}" stroke-width="5" stroke-linecap="round"/><path d="M148 82h38" stroke="#2ab8c8" stroke-width="5" stroke-linecap="round"/><text x="752" y="752" text-anchor="end" fill="#53616e" font-size="21" font-weight="700" letter-spacing="1">{title}</text><text x="48" y="752" fill="#8b98a4" font-size="14" letter-spacing="2">NR-{code}</text></g>
</svg>'''


def main():
    products = json.loads(CATALOG.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    for product in products:
        (OUT / f"{product['code']}.svg").write_text(svg_for(product), encoding="utf-8")
    print(f"Generated {len(products)} product illustrations in {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
