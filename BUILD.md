# Rakentaminen

Sääntö: malli kirjoittaa, koodi omistaa tilan, ihminen hyväksyy lähetyksen.

## Mitä rakennetaan

Yksi kaista:

`liidi → tutkimus → luonnos → hyväksyntä → lähetys → CRM → vastaus → tapaaminen`

Ei OS:ää. Ei kylmää outboundia. Ei puhelinta.

## Pino

Next.js + TypeScript + Postgres + Inngest + Claude (Sonnet) + Gmail OAuth + HubSpot + Stripe + Vercel.

## Järjestys

**Viikko 1**  
Auth, organisaatio, playbook-lomake, `leads`-taulu, inbox-näkymä. Liidi sisään webhookilla tai CSV:llä.

**Viikko 2**  
Claude-työkalut `research_lead` ja `propose_email`. Luonnos inboxiin. Ihminen lähettää vielä käsin jos OAuth ei ehdi.

Valmius: 20 oikeaa liidiä, 7/10 luonnosta kelpaa pienellä muokkauksella.

**Viikot 3–4**  
Gmail-lähetys hyväksynnän jälkeen. Tilakone + taustajonot. HubSpot-kirjaus. Audit + hinta per liidi.

Valmius: ensimmäinen maksava, 490 €/kk.

**Viikot 5–6**  
Vastauksen luokittelu, seuraava luonnos, kalenterivaraus, `needs_human`-jono.

Valmius: 3 asiakasta.

**Viikot 7–8**  
Näkyvä työkulku, replay (“miksi tämä jäi kesken”), dashboard. Ei uusia kanavia.

## Ensimmäiset tiedostot

```
app/
  (auth)/
  inbox/page.tsx
  playbook/page.tsx
lib/
  db.ts
  state.ts          # tilakone
  agents/research.ts
  agents/draft.ts
  tools.ts          # propose_email, ei send_email
  mail.ts           # lähetys vasta approve-jälkeen
```

## Älä rakenna vielä

- “kerro tavoite, AI keksii prosessin”
- LinkedIn / soittaja
- oma malli
- 20 integraatiota
- agentit jotka keskustelevat keskenään

## Valmis, kun vieras käyttäjä

1. luo tilin ja playbookin
2. kytkee Gmailin
3. tuo 10 liidiä
4. hyväksyy luonnoksen puhelimesta
5. näkee viestin Gmailissa ja merkinnän HubSpotissa
6. maksaa Stripessä

Jos tämä polku on rikki, älä lisää agentteja.

Pidempi versio: [PLAN.md](./PLAN.md)
