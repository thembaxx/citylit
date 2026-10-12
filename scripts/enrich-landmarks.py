"""Add provincial landmarks and extra Wikimedia photographs and short films.

Photographs stay local JPEGs. A film is kept only when Commons offers a short,
freely licensed file small enough to ship with the app.
"""
import hashlib
import html
import json
import pathlib
import re
import time
import urllib.parse

from safe_fetch import WIKIMEDIA_HOSTS, fetch_bytes, fetch_json
from safe_images import save_photo

HOSTS = WIKIMEDIA_HOSTS | frozenset({"thumb.wikimedia.org"})

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public/data"
IMG = ROOT / "public/images"
VID = ROOT / "public/videos"
VID.mkdir(exist_ok=True)

ADDITIONS = {
    "johannesburg": [
        ("Constitution Hill", "Constitution Hill, Johannesburg", "https://en.wikipedia.org/wiki/Constitution_Hill,_Johannesburg", "A former prison fort on the ridge, now a museum of the constitution and the people who were held there.", [("Where", "Hillbrow ridge"), ("Known for", "Old Fort, Number Four and the Constitutional Court")]),
        ("Apartheid Museum", "Apartheid Museum", "https://en.wikipedia.org/wiki/Apartheid_Museum", "A museum south of the city that walks through the apartheid years and the long fight against them.", [("Where", "Gold Reef City precinct"), ("Opened", "2001")]),
    ],
    "cape-town": [
        ("Castle of Good Hope", "Castle of Good Hope", "https://en.wikipedia.org/wiki/Castle_of_Good_Hope", "The star-shaped fort of the Dutch East India Company, still standing in the middle of the city.", [("Built", "1666–1679"), ("Known for", "Oldest surviving colonial building in South Africa")]),
        ("Robben Island", "Robben Island", "https://en.wikipedia.org/wiki/Robben_Island", "The island prison in Table Bay where Nelson Mandela and other political prisoners were held.", [("Status", "UNESCO World Heritage Site"), ("Visit", "Ferry from the V&A Waterfront")]),
    ],
    "durban": [
        ("Durban Botanic Gardens", "Durban Botanic Gardens", "https://en.wikipedia.org/wiki/Durban_Botanic_Gardens", "A historic garden of rare plants and shaded walks in the Berea.", [("Founded", "1849"), ("Known for", "Oldest botanic garden on the African continent")]),
        ("Durban City Hall", "Durban City Hall", "https://en.wikipedia.org/wiki/Durban_City_Hall", "The domed civic hall on Francis Farewell Square, with the natural science museum and art gallery inside.", [("Opened", "1910"), ("Where", "Francis Farewell Square")]),
    ],
    "pretoria": [
        ("Voortrekker Monument", "Voortrekker Monument", "https://en.wikipedia.org/wiki/Voortrekker_Monument", "A granite monument on a hill south of the capital, with a long marble frieze inside.", [("Completed", "1949"), ("Where", "Proclamation Hill")]),
        ("Church Square", "Church Square, Pretoria", "https://en.wikipedia.org/wiki/Church_Square,_Pretoria", "The historic heart of the capital, ringed by the Palace of Justice, the Ou Raadsaal and Kruger’s statue.", [("Where", "Central Pretoria"), ("Known for", "Kruger statue and the Ou Raadsaal")]),
    ],
    "stellenbosch": [
        ("Moederkerk", "Moederkerk, Stellenbosch", "https://en.wikipedia.org/wiki/Moederkerk,_Stellenbosch", "The white church that closes the view down Drostdy Street, a landmark of the oak town.", [("Where", "Drostdy Street"), ("Known for", "Dutch Reformed landmark of the town")]),
        ("Jonkershoek", "Jonkershoek Nature Reserve", "https://en.wikipedia.org/wiki/Jonkershoek_Nature_Reserve", "A mountain reserve of fynbos, streams and waterfalls at the head of the valley.", [("Where", "Hottentots Holland mountains"), ("Good for", "Hiking trails")]),
    ],
    "pietermaritzburg": [
        ("KwaZulu-Natal Museum", "KwaZulu-Natal Museum", "https://en.wikipedia.org/wiki/KwaZulu-Natal_Museum", "Natural and cultural collections in a city-centre museum, including the famous mammal halls.", [("Founded", "1904"), ("Where", "Loop Street")]),
        ("Howick Falls", "Howick Falls", "https://en.wikipedia.org/wiki/Howick_Falls", "A waterfall of about 95 metres on the uMngeni River, a short drive from the city.", [("Drop", "About 95 metres"), ("River", "uMngeni")]),
    ],
    "gqeberha": [
        ("Nelson Mandela Bay Stadium", "Nelson Mandela Bay Stadium", "https://en.wikipedia.org/wiki/Nelson_Mandela_Bay_Stadium", "The 2010 World Cup stadium beside North End Lake.", [("Opened", "2009"), ("Where", "North End")]),
        ("Route 67", "Route 67 (Port Elizabeth)", "https://en.wikipedia.org/wiki/Route_67_(Port_Elizabeth)", "A public-art walk of 67 works marking Mandela’s 67 years of public life.", [("Route", "Campanile to the Donkin Reserve"), ("Known for", "Outdoor art trail")]),
    ],
    "bloemfontein": [
        ("Naval Hill", "Naval Hill", "https://en.wikipedia.org/wiki/Naval_Hill", "A game reserve and lookout on the hill above the city, with a planetarium on the crest.", [("Known for", "Franklin Game Reserve"), ("Also", "Naval Hill Planetarium")]),
        ("Women's Memorial", "National Women's Monument", "https://en.wikipedia.org/wiki/National_Women%27s_Monument", "The memorial to women and children who died in the camps of the South African War.", [("Unveiled", "1913"), ("Known for", "Sculpture by Anton van Wouw")]),
    ],
    "mbombela": [
        ("Kruger National Park", "Kruger National Park", "https://en.wikipedia.org/wiki/Kruger_National_Park", "The great Lowveld reserve of bush, rivers and wildlife, reached from the gates near the city.", [("Scale", "Nearly two million hectares"), ("Gates", "Numbi and Malelane are the closest")]),
        ("God's Window", "God's Window", "https://en.wikipedia.org/wiki/God%27s_Window", "A cliff lookout on the escarpment, with a view across the Lowveld on a clear day.", [("Route", "Panorama Route"), ("Known for", "Blyde River Canyon views")]),
    ],
    "polokwane": [
        ("Peter Mokaba Stadium", "Peter Mokaba Stadium", "https://en.wikipedia.org/wiki/Peter_Mokaba_Stadium", "The city’s 2010 World Cup stadium, named for the struggle activist Peter Mokaba.", [("Opened", "2010"), ("Scale", "About 45,000 seats")]),
        ("Mapungubwe", "Mapungubwe National Park", "https://en.wikipedia.org/wiki/Mapungubwe_National_Park", "A world-heritage hill kingdom on the Limpopo, older than Great Zimbabwe and a long drive north of the city.", [("Status", "UNESCO World Heritage Site"), ("Where", "Limpopo River confluence")]),
    ],
    "kimberley": [
        ("Wildebeest Kuil", "Wildebeest Kuil Rock Art Centre", "https://en.wikipedia.org/wiki/Wildebeest_Kuil_Rock_Art_Centre", "A rock-engraving site and interpretation centre just outside the city.", [("Known for", "San engravings"), ("Where", "About 15 km from Kimberley")]),
        ("Magersfontein", "Battle of Magersfontein", "https://en.wikipedia.org/wiki/Battle_of_Magersfontein", "A battlefield of the South African War, with a hill of trenches south of the diamond city.", [("When", "11 December 1899"), ("Where", "South of Kimberley")]),
    ],
    "mahikeng": [
        ("Lotlamoreng Dam", "Lotlamoreng Dam", "https://en.wikipedia.org/wiki/Lotlamoreng_Dam", "A dam and cultural ground on the southern edge of the city.", [("Where", "South of the city centre"), ("Known for", "Cultural gatherings beside the water")]),
        ("Botsalano Game Reserve", "Botsalano Game Reserve", "https://en.wikipedia.org/wiki/Botsalano_Game_Reserve", "Open grassland and rhino country near the Botswana border, north-west of the city.", [("Known for", "Rhino and open grassland"), ("Where", "About 30 km from Mahikeng")]),
    ],
}

FACTS = {
    "Ponte City": [("Where", "Berea, Johannesburg"), ("Height", "54 storeys"), ("Completed", "1975")],
    "Nelson Mandela Bridge": [("Where", "Newtown to Braamfontein"), ("Opened", "2003"), ("Length", "284 metres")],
    "Orlando Towers": [("Where", "Soweto"), ("Was", "Orlando Power Station cooling towers"), ("Now", "Murals and an adventure jump")],
    "Table Mountain": [("Height", "About 1,085 m"), ("Park", "Table Mountain National Park"), ("Cableway", "Opened 1929")],
    "Bo-Kaap": [("Where", "Slopes of Signal Hill"), ("Known for", "Cape Malay history and painted houses")],
    "Cape Point": [("Park", "Table Mountain National Park"), ("Known for", "Cliffs, fynbos and the lighthouse")],
    "Moses Mabhida": [("Built for", "2010 World Cup"), ("Arch", "106 metres"), ("Visit", "Skywalk and adventure swing")],
    "uShaka Marine World": [("Where", "The Point, Durban"), ("Opened", "2004"), ("Known for", "Aquarium and water park")],
    "Umhlanga Lighthouse": [("Where", "Umhlanga Rocks"), ("Built", "1954"), ("Look", "Red-and-white tower on the rocks")],
    "Freedom Park": [("Where", "Salvokop, Pretoria"), ("Known for", "Garden of Remembrance and //hapo")],
    "Union Buildings": [("Where", "Meintjieskop"), ("Completed", "1913"), ("Designed by", "Herbert Baker")],
    "State Theatre": [("Where", "Pretorius Street"), ("Opened", "1981"), ("Known for", "Opera, dance and drama")],
    "Village Museum": [("Where", "Stellenbosch"), ("Known for", "Period houses from four centuries")],
    "Stellenbosch Botanical Garden": [("Kind", "University garden"), ("Known for", "Quiet paths in the middle of town")],
    "Dorp Street": [("Where", "Stellenbosch"), ("Known for", "Oak trees and Cape Dutch gables")],
    "City Hall": [("Where", "Pietermaritzburg centre"), ("Known for", "Red brick and a clock tower")],
    "Tatham Art Gallery": [("Where", "Opposite City Hall"), ("Known for", "South African and international art")],
    "KZN Botanical Garden": [("Garden", "KwaZulu-Natal National Botanical Garden"), ("Known for", "Indigenous plants and tree-lined walks")],
    "Donkin Reserve": [("Where", "Central Gqeberha"), ("Known for", "Stone pyramid and lighthouse")],
    "Bayworld": [("Where", "Beachfront"), ("Known for", "Natural and cultural history")],
    "Boardwalk": [("Where", "Summerstrand"), ("Known for", "Hotels and the beachfront precinct")],
    "Oliewenhuis": [("Where", "Grant’s Hill"), ("Known for", "Art collections and outdoor sculpture")],
    "Free State Botanical Garden": [("Garden", "Free State National Botanical Garden"), ("Known for", "Indigenous trees, koppies and trails")],
    "Sand du Plessis Theatre": [("Where", "Bloemfontein"), ("Known for", "Theatre, dance and music")],
    "Lowveld Botanical Garden": [("Where", "Beside the Crocodile River"), ("Known for", "Waterfall and Lowveld plants")],
    "Sudwala Caves": [("Where", "West of Mbombela"), ("Known for", "Ancient limestone chambers")],
    "Mbombela Stadium": [("Built for", "2010 World Cup"), ("Known for", "Supports shaped like giraffe necks")],
    "Bakone Malapa": [("Where", "Polokwane"), ("Known for", "Northern Sotho open-air heritage")],
    "Polokwane Art Museum": [("Where", "Polokwane"), ("Known for", "Municipal paintings and sculpture")],
    "Meropa": [("Where", "Just outside Polokwane"), ("Known for", "Hotel and entertainment resort")],
    "The Big Hole": [("Where", "Kimberley"), ("Known for", "Historic diamond excavation and museum town")],
    "McGregor Museum": [("Where", "Kimberley"), ("Known for", "Natural history and Northern Cape archives")],
    "William Humphreys Art Gallery": [("Where", "Kimberley"), ("Known for", "South African and international art")],
    "Mahikeng Museum": [("Where", "Historic Mahikeng"), ("Known for", "Siege history and regional collections")],
    "Game Reserve": [("Where", "Edge of Mahikeng"), ("Known for", "Grassland and wildlife close to town")],
    "Mmabatho Palms": [("Where", "Beside Leopard Park"), ("Known for", "Hotel and golf-course retreat")],
}

SKIP = re.compile(r"logo|flag|icon|locator|coa\b|coat of arms|diagram|map\b|signature|seal\b|emblem|svg", re.I)
REJECT = {"caribou from wagon trails.jpg"}
GENERIC = {
    "hotel",
    "park",
    "museum",
    "garden",
    "theatre",
    "theater",
    "national",
    "south",
    "africa",
    "african",
    "city",
    "club",
    "house",
    "street",
    "reserve",
    "game",
    "world",
    "centre",
    "center",
}


def clean(value):
    return html.unescape(re.sub("<[^>]*>", "", value or "")).strip()


def allowed_license(name):
    lic = name.lower()
    if any(flag in lic for flag in ("nc", "noncommercial")):
        return False
    return "public domain" in lic or "cc0" in lic or lic.startswith("cc by") or "cc-by" in lic


def api(host, **params):
    params.setdefault("format", "json")

    def quote(value, safe="", encoding=None, errors=None):
        return urllib.parse.quote(str(value), safe="|")

    url = f"https://{host}/w/api.php?" + urllib.parse.urlencode(params, quote_via=quote)
    return fetch_json(url, allowed_hosts=WIKIMEDIA_HOSTS, timeout=40)


def batches(items, size):
    items = list(items)
    for start in range(0, len(items), size):
        yield items[start : start + size]


photo_cache = {}


def photo_from_info(title, info):
    meta = info.get("extmetadata", {})
    license_name = clean(meta.get("LicenseShortName", {}).get("value", ""))
    if not allowed_license(license_name):
        return None
    if SKIP.search(title):
        return None
    mime = info.get("mime", "")
    if mime not in ("image/jpeg", "image/png", "image/webp"):
        return None
    remote = info.get("thumburl") or info.get("url")
    if not remote:
        return None
    name = title.removeprefix("File:")
    key = name.replace("_", " ")
    if key.lower() in REJECT or SKIP.search(key):
        return None
    if key in photo_cache:
        return photo_cache[key]
    filename = hashlib.sha256(key.encode()).hexdigest()[:12] + ".jpg"
    dest = IMG / filename
    try:
        if not dest.exists():
            time.sleep(0.35)
            raw = fetch_bytes(remote, allowed_hosts=HOSTS, max_bytes=12 * 1024 * 1024, timeout=40).body
            save_photo(raw, dest)
        license_url = meta.get("LicenseUrl", {}).get("value", "") or ""
        parsed = urllib.parse.urlsplit(license_url)
        if parsed.scheme == "http" and parsed.hostname in ("creativecommons.org", "www.creativecommons.org"):
            license_url = urllib.parse.urlunsplit(parsed._replace(scheme="https"))
        record = {
            "alt": (clean(meta.get("ImageDescription", {}).get("value", "")) or key)[:180],
            "author": clean(meta.get("Artist", {}).get("value", ""))[:180] or "Wikimedia Commons",
            "license": license_name,
            "licenseUrl": license_url,
            "sourceUrl": info.get("descriptionurl") or f"https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(name.replace(' ', '_'))}",
            "filename": key,
            "src": "/images/" + filename,
        }
        photo_cache[key] = record
        print("Photo", key[:70], flush=True)
        return record
    except Exception as error:
        print("Skip photo", key[:60], remote[:90], str(error)[:80], flush=True)
        photo_cache[key] = None
        return None


def imageinfo(titles):
    pages = {}
    for group in batches(titles, 20):
        data = api(
            "commons.wikimedia.org",
            action="query",
            titles="|".join(group),
            prop="imageinfo",
            iiprop="url|mime|size|extmetadata",
            iiurlwidth=1200,
        )
        pages.update(data.get("query", {}).get("pages", {}))
        time.sleep(0.2)
    return pages


def page_bundle(titles):
    pages = {}
    redirects = {}
    for group in batches(dict.fromkeys(titles), 12):
        data = api(
            "en.wikipedia.org",
            action="query",
            redirects=1,
            prop="extracts|pageimages|images|info",
            inprop="url",
            exintro=1,
            explaintext=1,
            exchars=520,
            piprop="name",
            imlimit=12,
            titles="|".join(group),
        )
        pages.update(data.get("query", {}).get("pages", {}))
        for item in data.get("query", {}).get("redirects", []):
            redirects[item["from"]] = item["to"]
        time.sleep(0.2)
    by_title = {}
    for page in pages.values():
        if page.get("missing") is not None or "extract" not in page:
            continue
        if "may refer to" in page.get("extract", "")[:80]:
            continue
        by_title[page["title"]] = page
    return by_title, redirects


def filenames_for(page):
    names = []
    if page.get("pageimage"):
        names.append(page["pageimage"])
    for image in page.get("images", []):
        title = image.get("title", "").removeprefix("File:")
        if title.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            names.append(title)
    unique = []
    for name in names:
        if name and name not in unique and not SKIP.search(name):
            unique.append(name)
    return unique[:8]


def sentences(text):
    text = re.sub(r"\s+", " ", text or "").strip()
    parts = re.split(r"(?<=[.!?])\s+", text)
    clipped = " ".join(parts[:2]).strip()
    return clipped[:520]


def search_photos(query, limit=2):
    data = api(
        "commons.wikimedia.org",
        action="query",
        list="search",
        srsearch=query,
        srnamespace=6,
        srlimit=8,
    )
    hits = [hit["title"] for hit in data.get("query", {}).get("search", [])]
    if not hits:
        return []
    pages = imageinfo(hits)
    found = []
    words = [word.lower() for word in re.findall(r"[A-Za-z0-9']{4,}", query) if word.lower() not in GENERIC]
    for page in pages.values():
        info = (page.get("imageinfo") or [None])[0]
        if not info or not page.get("title"):
            continue
        photo = photo_from_info(page["title"], info)
        if not photo:
            continue
        blob = (photo["filename"] + " " + photo["alt"]).lower()
        if words and not any(word in blob for word in words):
            continue
        if any(item["src"] == photo["src"] for item in found):
            continue
        found.append(photo)
        if len(found) >= limit:
            break
    return found
    text = re.sub(r"\s+", " ", text or "").strip()
    parts = re.split(r"(?<=[.!?])\s+", text)
    clipped = " ".join(parts[:2]).strip()
    return clipped[:520]


def find_video(title):
    data = api(
        "commons.wikimedia.org",
        action="query",
        list="search",
        srsearch=f'"{title}" "South Africa" filetype:video',
        srnamespace=6,
        srlimit=6,
    )
    hits = [hit["title"] for hit in data.get("query", {}).get("search", [])]
    if not hits:
        return None
    pages = imageinfo(hits)
    words = [word.lower() for word in re.findall(r"[A-Za-z0-9']{4,}", title)]
    best = None
    for page in pages.values():
        info = (page.get("imageinfo") or [None])[0]
        file_title = page.get("title") or ""
        if not info:
            continue
        lowered = file_title.lower()
        if any(blocked in lowered for blocked in ("jpl", "nasa", "facility", "california", "psyche")):
            continue
        if words and not any(word in lowered for word in words):
            continue
        if info.get("mime") not in ("video/webm", "video/mp4"):
            continue
        size = info.get("size") or 0
        if not 80_000 <= size <= 5_500_000:
            continue
        meta = info.get("extmetadata", {})
        license_name = clean(meta.get("LicenseShortName", {}).get("value", ""))
        if not allowed_license(license_name):
            continue
        if best is None or size < best[0]:
            best = (size, file_title, info, license_name, meta)
    if not best:
        return None
    _, file_title, info, license_name, meta = best
    name = file_title.removeprefix("File:")
    ext = "webm" if info["mime"] == "video/webm" else "mp4"
    filename = hashlib.sha256(name.encode()).hexdigest()[:12] + "." + ext
    dest = VID / filename
    try:
        if not dest.exists():
            time.sleep(0.4)
            raw = fetch_bytes(info["url"], allowed_hosts=WIKIMEDIA_HOSTS, max_bytes=6 * 1024 * 1024, timeout=60).body
            if len(raw) < 80_000:
                return None
            dest.write_bytes(raw)
        license_url = meta.get("LicenseUrl", {}).get("value", "") or ""
        parsed = urllib.parse.urlsplit(license_url)
        if parsed.scheme == "http" and parsed.hostname in ("creativecommons.org", "www.creativecommons.org"):
            license_url = urllib.parse.urlunsplit(parsed._replace(scheme="https"))
        print("Video", name[:70], flush=True)
        return {
            "src": "/videos/" + filename,
            "title": name[:140],
            "author": clean(meta.get("Artist", {}).get("value", ""))[:180] or "Wikimedia Commons",
            "license": license_name,
            "licenseUrl": license_url,
            "sourceUrl": info.get("descriptionurl") or "",
        }
    except Exception as error:
        print("Skip video", name[:60], str(error)[:80], flush=True)
        dest.unlink(missing_ok=True)
        return None


def main():
    cities = json.load(open(OUT / "cities.json"))
    landmarks = json.load(open(OUT / "landmarks.json"))
    renames = {
        ("stellenbosch", "Botanical Garden"): ("Stellenbosch Botanical Garden", "Stellenbosch University Botanical Garden"),
        ("pietermaritzburg", "Botanical Garden"): ("KZN Botanical Garden", "KwaZulu-Natal National Botanical Garden"),
        ("bloemfontein", "Botanical Garden"): ("Free State Botanical Garden", "Free State National Botanical Garden"),
        ("polokwane", "Art Museum"): ("Polokwane Art Museum", "Polokwane Art Museum"),
    }
    for city in cities:
        city["landmarks"] = [
            renames[(city["slug"], name)][0] if (city["slug"], name) in renames else name
            for name in city["landmarks"]
        ]
    by_name = {row["name"]: row for row in landmarks}
    wanted = []
    for city in cities:
        for name in city["landmarks"]:
            wanted.append(name)
            by_name.setdefault(name, {"name": name, "images": [], "wikipedia": ""})
        for name, wiki, link, description, facts in ADDITIONS.get(city["slug"], []):
            if name not in city["landmarks"]:
                city["landmarks"].append(name)
                city.setdefault("descriptions", []).append(description)
                city.setdefault("landmarkLinks", []).append(link)
            wanted.append(name)
            FACTS.setdefault(name, facts)
            by_name.setdefault(name, {"name": name, "wikipedia": link, "images": []})
    wiki_titles = []
    title_for = {}
    for (_slug, _old), (new, wiki) in renames.items():
        title_for[new] = wiki
        wiki_titles.append(wiki)
    for city in cities:
        for name, wiki, *_rest in ADDITIONS.get(city["slug"], []):
            title_for[name] = wiki
            wiki_titles.append(wiki)
    for row in by_name.values():
        if row.get("wikipedia") and "/wiki/" in row["wikipedia"]:
            slug = urllib.parse.unquote(row["wikipedia"].rstrip("/").split("/wiki/")[-1]).replace("_", " ")
            title_for.setdefault(row["name"], slug)
            wiki_titles.append(slug)
    known_pages = {
        "Freedom Park": "Freedom Park (South Africa)",
        "Union Buildings": "Union Buildings",
        "State Theatre": "State Theatre (Pretoria)",
        "Village Museum": "Stellenbosch Village Museum",
        "City Hall": "Pietermaritzburg City Hall",
        "Tatham Art Gallery": "Tatham Art Gallery",
        "Donkin Reserve": "Donkin Reserve",
        "Bayworld": "Bayworld",
        "Oliewenhuis": "Oliewenhuis Art Museum",
        "Sand du Plessis Theatre": "Sand du Plessis Theatre",
        "Lowveld Botanical Garden": "Lowveld National Botanical Garden",
        "Sudwala Caves": "Sudwala Caves",
        "Mbombela Stadium": "Mbombela Stadium",
        "Bakone Malapa": "Bakone Malapa Open-Air Museum",
        "The Big Hole": "Big Hole",
        "McGregor Museum": "McGregor Museum",
        "William Humphreys Art Gallery": "William Humphreys Art Gallery",
        "Mahikeng Museum": "Mafikeng Museum",
        "Umhlanga Lighthouse": "Umhlanga, KwaZulu-Natal",
        "Ponte City": "Ponte City",
        "Nelson Mandela Bridge": "Nelson Mandela Bridge",
        "Orlando Towers": "Orlando Power Station",
        "Table Mountain": "Table Mountain",
        "Bo-Kaap": "Bo-Kaap",
        "Cape Point": "Cape Point",
        "Moses Mabhida": "Moses Mabhida Stadium",
        "uShaka Marine World": "uShaka Marine World",
    }
    for name, wiki in known_pages.items():
        if name in by_name:
            title_for.setdefault(name, wiki)
            wiki_titles.append(wiki)
    pages, redirects = page_bundle(wiki_titles)
    resolved = {}
    for name, title in title_for.items():
        title = redirects.get(title, title)
        page = pages.get(title)
        if page:
            resolved[name] = page
    file_titles = []
    for page in resolved.values():
        file_titles.extend("File:" + name.replace(" ", "_") for name in filenames_for(page))
    infos = imageinfo(dict.fromkeys(file_titles))
    info_by_file = {}
    for page in infos.values():
        info = (page.get("imageinfo") or [None])[0]
        if info and page.get("title"):
            info_by_file[page["title"].replace(" ", "_")] = info
    films_left = 6
    film_priority = [
        "Table Mountain",
        "Cape Point",
        "Robben Island",
        "Kruger National Park",
        "Union Buildings",
        "Castle of Good Hope",
        "Moses Mabhida",
        "The Big Hole",
        "Voortrekker Monument",
        "God's Window",
    ]
    ordered = film_priority + [name for name in wanted if name not in film_priority]
    for name in ordered:
        row = by_name[name]
        page = resolved.get(name)
        if page:
            row["wikipedia"] = page.get("fullurl") or row.get("wikipedia")
            about = sentences(page.get("extract", ""))
            if about:
                row["about"] = about
                row["aboutSource"] = row["wikipedia"]
                row["aboutLicense"] = "https://creativecommons.org/licenses/by-sa/4.0/"
            fresh = []
            for filename in filenames_for(page):
                info = info_by_file.get("File:" + filename.replace(" ", "_"))
                if not info:
                    continue
                photo = photo_from_info("File:" + filename, info)
                if photo and not any(item["src"] == photo["src"] for item in fresh):
                    fresh.append(photo)
                if len(fresh) >= 3:
                    break
            if fresh:
                merged = []
                for photo in fresh + row.get("images", []):
                    if not any(item["src"] == photo["src"] for item in merged):
                        merged.append(photo)
                row["images"] = merged[:4]
        if name in FACTS:
            row["facts"] = [{"label": label, "value": value} for label, value in FACTS[name]]
        if films_left and name in film_priority and not row.get("video"):
            video = find_video(title_for.get(name, name))
            if video:
                row["video"] = video
                films_left -= 1
    ordered_rows = []
    seen = set()
    for name in wanted:
        if name in seen:
            continue
        seen.add(name)
        ordered_rows.append(by_name[name])
    queries = {
        "Ponte City": "Ponte City Johannesburg",
        "State Theatre": "State Theatre Pretoria",
        "Village Museum": "Stellenbosch Village Museum",
        "Dorp Street": "Dorp Street Stellenbosch",
        "Tatham Art Gallery": "Tatham Art Gallery",
        "KwaZulu-Natal Museum": "KwaZulu-Natal Museum",
        "Donkin Reserve": "Donkin Reserve pyramid",
        "Bayworld": "Bayworld Port Elizabeth museum",
        "Boardwalk": "Boardwalk Summerstrand Port Elizabeth",
        "Route 67": "Route 67 Port Elizabeth",
        "Oliewenhuis": "Oliewenhuis Art Museum Bloemfontein",
        "Sand du Plessis Theatre": "Sand du Plessis Theatre Bloemfontein",
        "Naval Hill": "Naval Hill Bloemfontein",
        "God's Window": "God's Window Mpumalanga",
        "Bakone Malapa": "Bakone Malapa Polokwane",
        "Polokwane Art Museum": "Polokwane Art Museum",
        "Meropa": "Meropa Polokwane",
        "William Humphreys Art Gallery": "William Humphreys Art Gallery Kimberley",
        "Wildebeest Kuil": "Wildebeest Kuil rock art",
        "Mahikeng Museum": "Mafikeng Museum",
        "Game Reserve": "Mahikeng game reserve",
        "Mmabatho Palms": "Mmabatho Palms",
        "Lotlamoreng Dam": "Lotlamoreng cultural village",
        "Botsalano Game Reserve": "Botsalano Game Reserve",
    }
    for row in ordered_rows:
        row["images"] = [photo for photo in row.get("images", []) if photo["filename"].lower() not in REJECT]
        if len(row["images"]) >= 2:
            continue
        extra = search_photos(queries.get(row["name"], row["name"] + " South Africa"), 2)
        for photo in extra:
            if not any(item["src"] == photo["src"] for item in row["images"]):
                row["images"].append(photo)
        row["images"] = row["images"][:4]
    places = json.load(open(OUT / "places.json"))
    place_titles = []
    for place in places:
        wiki = place.get("wikipedia")
        if wiki and len(place.get("images", [])) < 3:
            place_titles.append(urllib.parse.unquote(wiki.rstrip("/").split("/wiki/")[-1]).replace("_", " "))
    place_pages, place_redirects = page_bundle(place_titles)
    place_files = []
    for page in place_pages.values():
        place_files.extend("File:" + name.replace(" ", "_") for name in filenames_for(page))
    place_infos = imageinfo(dict.fromkeys(place_files))
    place_info = {}
    for page in place_infos.values():
        info = (page.get("imageinfo") or [None])[0]
        if info and page.get("title"):
            place_info[page["title"].replace(" ", "_")] = info
    for place in places:
        wiki = place.get("wikipedia")
        if not wiki or len(place.get("images", [])) >= 3:
            continue
        title = urllib.parse.unquote(wiki.rstrip("/").split("/wiki/")[-1]).replace("_", " ")
        page = place_pages.get(place_redirects.get(title, title))
        if not page:
            continue
        extra = []
        for filename in filenames_for(page):
            info = place_info.get("File:" + filename.replace(" ", "_"))
            if not info:
                continue
            photo = photo_from_info("File:" + filename, info)
            if photo:
                extra.append(photo)
            if len(place["images"]) + len(extra) >= 3:
                break
        if extra:
            merged = []
            for photo in place["images"] + extra:
                if not any(item["src"] == photo["src"] for item in merged):
                    merged.append(photo)
            place["images"] = merged[:3]
            if not place["images"]:
                continue
            if place.get("imageContext") != "venue" and place["images"]:
                pass
    city_name = {city["slug"]: city["short"] for city in cities}
    for place in places:
        if len(place.get("images", [])) >= 2:
            continue
        extra = search_photos(f"{place['name']} {city_name.get(place['city'], '')}", 2)
        for photo in extra:
            if not any(item["src"] == photo["src"] for item in place["images"]):
                place["images"].append(photo)
        place["images"] = place["images"][:3]
    credits = json.load(open(OUT / "image-credits.json"))
    known = {item["src"] for item in credits}
    for row in ordered_rows:
        for photo in row.get("images", []):
            if photo["src"] not in known:
                credits.append(photo)
                known.add(photo["src"])
    for place in places:
        for photo in place.get("images", []):
            if photo["src"] not in known:
                credits.append(photo)
                known.add(photo["src"])
    json.dump(cities, open(OUT / "cities.json", "w"), ensure_ascii=False, indent=2)
    json.dump(ordered_rows, open(OUT / "landmarks.json", "w"), ensure_ascii=False, indent=2)
    json.dump(places, open(OUT / "places.json", "w"), ensure_ascii=False, indent=2)
    json.dump(credits, open(OUT / "image-credits.json", "w"), ensure_ascii=False, indent=2)
    films = sum(1 for row in ordered_rows if row.get("video"))
    photos = sum(len(row.get("images", [])) for row in ordered_rows)
    print(f"Landmarks {len(ordered_rows)} photos {photos} films {films} place-images {sum(len(p['images']) for p in places)}", flush=True)


if __name__ == "__main__":
    main()
