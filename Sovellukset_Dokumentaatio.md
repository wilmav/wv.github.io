# Sovellukset.com – Projektidokumentaatio ja Käyttöopas

Tämä dokumentti tarjoaa kattavan yleiskuvauksen Sovellukset.com-sivuston palveluista, niiden teknisestä toteutuksesta, tietolähteistä sekä tulevaisuuden kehityssuunnitelmista.

---

## 1. Yleisarkkitehtuuri ja Teknologiat

Sivusto on toteutettu **"Static First"** -periaatteella, painottaen nopeutta, tietoturvaa ja helppoa ylläpidettävyyttä.

- **Frontend**: Standardi HTML5, CSS3 (Vanilla) ja JavaScript (ES6+).
- **Tyylit**: Responsiivinen "Saffron & Slate" -teema, jossa on sisäänrakennettu tuki pimeälle tilalle (Dark Mode).
- **Tallennus**: Käyttäjäasetukset (esim. suosikkikirjailijat, sähkön hintatiedot) tallennetaan paikallisesti selaimen `localStorage`-muistiin.
- **Kuvaajat**: Visualisoinnit on toteutettu [Chart.js](https://www.chartjs.org/)-kirjastolla.

---

## 2. Sovellukset

### 2.1 Kirjavinkit (Uutuuskirjojen seuranta)
Sovellus auttaa käyttäjiä löytämään suosikkikirjailijoidensa uusimmat teokset ja seuraamaan tulevia julkaisuja.

- **Teknologiat**: JavaScript (Async/Await), CSS Grid/Flexbox.
- **Tietolähteet**:
  - **[Finna.fi API](https://www.finna.fi)**: Kirjojen perustiedot, haku ja metadata.
  - **[Google Books API](https://books.google.com)**: Kirjojen esittelytekstit ja kotimaiset kansikuvat.
  - **[Open Library API](https://openlibrary.org)**: Varalähde kansikuville ja ISBN-tunnisteille.
- **Toimintaperiaate**: Sovellus hakee tietoja reaaliajassa rajapintojen kautta. Käyttäjän suosikit tallennetaan selaimeen, jolloin sovellus voi korostaa uusia tuloksia.
- **Käyttöohje**: Etsi kirjailijaa hakukentällä, lisää hänet "Suosikkeihin" sydän- tai plus-painikkeella. Etusivu näyttää automaattisesti uusimmat teokset.

### 2.2 Kuitulaskuri (Ravintokuitujen seuranta)
Yksinkertainen työkalu päivittäisen kuitumäärän tarkkailuun.

- **Tietolähteet**: **[Fineli](https://fineli.fi/fineli/fi/index)** (Terveyden ja hyvinvoinnin laitos).
- **Toimintaperiaate**: Laskuri perustuu esivalittuun listaan kuitupitoisia elintarvikkeita. Käyttäjä syöttää syödyn määrän grammoina, ja sovellus laskee kuitumäärän suhteessa suosituksiin (Naiset: 25g, Miehet: 35g).
- **Erityisominaisuudet**: Tuki kolmelle kielelle (Suomi, Ruotsi, Englanti).

### 2.3 SpotVaiFix (Sähkön hintavertailu)
Työkalu pörssisähkön ja kiinteähintaisen sopimuksen väliseen hintavertailuun.

- **Tietolähteet**:
  - **[Sahkotin.fi](https://sahkotin.fi)**: Reaaliaikaiset pörssihinnat.
  - **[Open-Meteo](https://open-meteo.com)**: Historialliset lämpötilat (Helsinki).
- **Toimintaperiaate**: Sovellus vertaa pörssisähkön toteutunutta keskihintaa käyttäjän määrittämään kiinteään hintaan. Se visualisoi hinnan ja lämpötilan korrelaatiota, auttaen arvioimaan kulutusvaikutusta.
- **Käyttöohje**: Syötä nykyiset sopimustiedot ja kuukausikulutusarvio. Tarkastele visualisointia havaitaksesi, milloin pörssisähkö on ollut kannaltasi edullisinta.

### 2.4 Lumivuodet (Talvivertailu – BETA)
Visualisointityökalu talvien lumitilanteen ja ääriolosuhteiden vertailuun.

- **Tietolähteet**: **[Ilmatieteen laitos (FMI)](https://www.ilmatieteenlaitos.fi/)**.
- **Toimintaperiaate**: Sovellus visualisoi talvipäivien segmenttejä (lumi, lumeton, helle, sateeton) dynaamisena aikajanana.
- **Status**: Tällä hetkellä kehitysvaiheessa (piilotettu menu-valikosta).

---

## 3. Laadunvarmistus ja Bugiträkkäys

Sovellusten kehityksessä noudatetaan seuraavia laadunhallinnan tapoja:

1.  **Yhteydenottolomake**: Sivuston "Ota yhteyttä" -sivu lähettää viestit suoraan ylläpidolle (FormSubmit). Tämä on ensisijainen kanava loppukäyttäjille.
2.  **GitHub Issues**: (Sisäinen / Tuleva) Kehittäjät seuraavat teknisiä bugeja versionhallinnan kautta.
3.  **Selaintesterit**: Automaattiset tarkistukset API-vastausten ja visualisointien eheyden varmistamiseksi.

---

## 4. Kehityssuunnitelma (Roadmap)

### Parannusehdotukset
- **PWA (Progressive Web App)**: Mahdollisuus asentaa sovellukset mobiililaitteeseen ja käyttää niitä rajoitetusti ilman internetyhteyttä.
- **Service Workers**: Nopeampi latausaika välimuistin avulla.
- **Parannettu tietojen tallennus**: Mahdollisuus viedä ja tuoda asetukset JSON-tiedostona.

### Uudet Ominaisuudet
- **Kirjavinkit**: Sähköpostimuistutukset suosikkikirjailijan uudesta kirjasta.
- **SpotVaiFix**: Tuki useammalle verkkoyhtiölle (siirtomaksujen automaattinen laskenta).
- **Kuitulaskuri**: Laajempi Fineli-integraatio, jossa käyttäjä voi hakea minkä tahansa elintarvikkeen.

---

*Tämä dokumentti on luotu 9. tammikuuta 2026. Alkuperäinen tiedosto: `Sovellukset_Dokumentaatio.md`*
