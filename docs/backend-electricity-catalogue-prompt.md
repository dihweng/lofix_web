# Backend Engineering Prompt: National Electricity Catalogue API (`GET /bills/vtpass/electricity/catalogue`)

## Goal
Implement a server-authoritative electricity catalogue endpoint in the Lofix backend service (`/bills/vtpass/electricity/catalogue`). The endpoint provides national discovery coverage across all 36 Nigerian states plus the Federal Capital Territory (FCT), mapping each state to its serving Electricity Distribution Companies (DisCos), provider availability status, and distribution zone coverage notes.

---

## Endpoint Specification

### Route
`GET /bills/vtpass/electricity/catalogue`

### Headers
- `Authorization`: `Bearer <jwt_token>`
- `Accept`: `application/json`

### HTTP Responses
- `200 OK`: Catalogue fetched successfully.
- `401 Unauthorized`: Missing or invalid authentication token.
- `500 Internal Server Error`: Server error while loading catalogue.

---

## Response JSON Schema & Types

```json
{
  "processor": "vtpass",
  "environment": "sandbox",
  "coverageNote": "State mapping is distribution-zone guidance, not a meter-level guarantee. Please match the distribution company on your electricity bill before proceeding.",
  "states": [
    {
      "code": "LA",
      "name": "Lagos",
      "providerIds": ["ikeja-electric", "eko-electric"]
    }
  ],
  "providers": [
    {
      "serviceID": "ikeja-electric",
      "name": "Ikeja Electric (IKEDC)",
      "stateCodes": ["LA", "OG"],
      "stateCount": 2,
      "available": true,
      "coverageNote": "Serves Lagos Mainland, Ikeja, Ikorodu, Alimosho"
    },
    {
      "serviceID": "eko-electric",
      "name": "Eko Electricity (EKEDC)",
      "stateCodes": ["LA"],
      "stateCount": 1,
      "available": false,
      "unavailableReason": "Eko Electric checkout currently undergoing provider maintenance.",
      "coverageNote": "Serves Lagos Island, Lekki, VI, Apapa, Festac"
    }
  ]
}
```

---

## Complete National Dataset Reference

### 1. States Array (`states`) — 36 States + FCT

```json
[
  { "code": "AB", "name": "Abia", "providerIds": ["enugu-electric", "aba-electric"] },
  { "code": "AD", "name": "Adamawa", "providerIds": ["yola-electric", "jos-electric"] },
  { "code": "AK", "name": "Akwa Ibom", "providerIds": ["portharcourt-electric"] },
  { "code": "AN", "name": "Anambra", "providerIds": ["enugu-electric"] },
  { "code": "BA", "name": "Bauchi", "providerIds": ["jos-electric"] },
  { "code": "BY", "name": "Bayelsa", "providerIds": ["portharcourt-electric"] },
  { "code": "BN", "name": "Benue", "providerIds": ["jos-electric", "abuja-electric"] },
  { "code": "BO", "name": "Borno", "providerIds": ["yola-electric", "jos-electric"] },
  { "code": "CR", "name": "Cross River", "providerIds": ["portharcourt-electric"] },
  { "code": "DE", "name": "Delta", "providerIds": ["benin-electric", "portharcourt-electric"] },
  { "code": "EB", "name": "Ebonyi", "providerIds": ["enugu-electric"] },
  { "code": "ED", "name": "Edo", "providerIds": ["benin-electric"] },
  { "code": "EK", "name": "Ekiti", "providerIds": ["benin-electric", "ibadan-electric"] },
  { "code": "EN", "name": "Enugu", "providerIds": ["enugu-electric"] },
  { "code": "FC", "name": "FCT (Abuja)", "providerIds": ["abuja-electric"] },
  { "code": "GO", "name": "Gombe", "providerIds": ["jos-electric"] },
  { "code": "IM", "name": "Imo", "providerIds": ["enugu-electric"] },
  { "code": "JI", "name": "Jigawa", "providerIds": ["kano-electric"] },
  { "code": "KD", "name": "Kaduna", "providerIds": ["kaduna-electric"] },
  { "code": "KN", "name": "Kano", "providerIds": ["kano-electric"] },
  { "code": "KT", "name": "Katsina", "providerIds": ["kano-electric"] },
  { "code": "KE", "name": "Kebbi", "providerIds": ["kaduna-electric"] },
  { "code": "KO", "name": "Kogi", "providerIds": ["abuja-electric"] },
  { "code": "KW", "name": "Kwara", "providerIds": ["ibadan-electric"] },
  { "code": "LA", "name": "Lagos", "providerIds": ["ikeja-electric", "eko-electric"] },
  { "code": "NS", "name": "Nasarawa", "providerIds": ["abuja-electric", "jos-electric"] },
  { "code": "NI", "name": "Niger", "providerIds": ["abuja-electric"] },
  { "code": "OG", "name": "Ogun", "providerIds": ["ibadan-electric", "ikeja-electric"] },
  { "code": "ON", "name": "Ondo", "providerIds": ["benin-electric"] },
  { "code": "OS", "name": "Osun", "providerIds": ["ibadan-electric"] },
  { "code": "OY", "name": "Oyo", "providerIds": ["ibadan-electric"] },
  { "code": "PL", "name": "Plateau", "providerIds": ["jos-electric"] },
  { "code": "RI", "name": "Rivers", "providerIds": ["portharcourt-electric"] },
  { "code": "SO", "name": "Sokoto", "providerIds": ["kaduna-electric"] },
  { "code": "TA", "name": "Taraba", "providerIds": ["yola-electric", "jos-electric"] },
  { "code": "YO", "name": "Yobe", "providerIds": ["yola-electric"] },
  { "code": "ZA", "name": "Zamfara", "providerIds": ["kaduna-electric"] }
]
```

### 2. Providers Array (`providers`) — 12 Electricity Distribution Companies

```json
[
  {
    "serviceID": "ikeja-electric",
    "name": "Ikeja Electric (IKEDC)",
    "stateCodes": ["LA", "OG"],
    "stateCount": 2,
    "available": true,
    "coverageNote": "Serves Lagos Mainland, Ikeja, Ikorodu, Alimosho"
  },
  {
    "serviceID": "eko-electric",
    "name": "Eko Electricity (EKEDC)",
    "stateCodes": ["LA"],
    "stateCount": 1,
    "available": false,
    "unavailableReason": "Eko Electric checkout currently undergoing provider maintenance.",
    "coverageNote": "Serves Lagos Island, Lekki, VI, Apapa, Festac"
  },
  {
    "serviceID": "portharcourt-electric",
    "name": "Port Harcourt Electric (PHED)",
    "stateCodes": ["RI", "BY", "CR", "AK"],
    "stateCount": 4,
    "available": true,
    "coverageNote": "Serves Rivers (Port Harcourt), Bayelsa, Cross River, Akwa Ibom"
  },
  {
    "serviceID": "aba-electric",
    "name": "Aba Power (APLE)",
    "stateCodes": ["AB"],
    "stateCount": 1,
    "available": true,
    "coverageNote": "Serves Aba metropolis and 9 LGAs in Abia State (Ring-fenced zone)"
  },
  {
    "serviceID": "abuja-electric",
    "name": "Abuja Electricity (AEDC)",
    "stateCodes": ["FC", "NS", "NI", "KO", "BN"],
    "stateCount": 5,
    "available": false,
    "unavailableReason": "Abuja Electric online purchase coming soon.",
    "coverageNote": "Serves FCT (Abuja), Nasarawa, Niger, Kogi"
  },
  {
    "serviceID": "jos-electric",
    "name": "Jos Electricity (JEDC)",
    "stateCodes": ["PL", "BN", "BA", "GO", "NS"],
    "stateCount": 5,
    "available": false,
    "unavailableReason": "Jos DisCo online purchase coming soon.",
    "coverageNote": "Serves Plateau (Jos), Benue, Bauchi, Gombe"
  },
  {
    "serviceID": "ibadan-electric",
    "name": "Ibadan Electricity (IBEDC)",
    "stateCodes": ["OY", "OG", "OS", "KW", "EK"],
    "stateCount": 5,
    "available": false,
    "unavailableReason": "IBEDC online purchase coming soon.",
    "coverageNote": "Serves Oyo (Ibadan), Ogun, Osun, Kwara"
  },
  {
    "serviceID": "kano-electric",
    "name": "Kano Electricity (KEDCO)",
    "stateCodes": ["KN", "KT", "JI"],
    "stateCount": 3,
    "available": false,
    "unavailableReason": "KEDCO online purchase coming soon.",
    "coverageNote": "Serves Kano, Katsina, Jigawa"
  },
  {
    "serviceID": "enugu-electric",
    "name": "Enugu Electricity (EEDC)",
    "stateCodes": ["EN", "AB", "AN", "EB", "IM"],
    "stateCount": 5,
    "available": false,
    "unavailableReason": "EEDC online purchase coming soon.",
    "coverageNote": "Serves Enugu, Abia, Anambra, Ebonyi, Imo"
  },
  {
    "serviceID": "kaduna-electric",
    "name": "Kaduna Electric (KAEDCO)",
    "stateCodes": ["KD", "SO", "KE", "ZA"],
    "stateCount": 4,
    "available": false,
    "unavailableReason": "KAEDCO online purchase coming soon.",
    "coverageNote": "Serves Kaduna, Sokoto, Kebbi, Zamfara"
  },
  {
    "serviceID": "benin-electric",
    "name": "Benin Electricity (BEDC)",
    "stateCodes": ["ED", "DE", "ON", "EK"],
    "stateCount": 4,
    "available": false,
    "unavailableReason": "BEDC online purchase coming soon.",
    "coverageNote": "Serves Edo (Benin), Delta, Ondo, Ekiti"
  },
  {
    "serviceID": "yola-electric",
    "name": "Yola Electricity (YEDC)",
    "stateCodes": ["AD", "BO", "TA", "YO"],
    "stateCount": 4,
    "available": false,
    "unavailableReason": "YEDC online purchase coming soon.",
    "coverageNote": "Serves Adamawa (Yola), Borno, Taraba, Yobe"
  }
]
```

---

## Architectural & Caching Guidelines

1. **Database / Configuration Seeding**:
   - Seed the `electricity_states` and `electricity_providers` tables (or JSON file) using the dataset above.
   - Admin controls should allow toggling `available: true/false` and updating `unavailableReason` dynamically per provider without needing client-side deployments.

2. **Server-Side Caching Strategy**:
   - Cache the JSON response in Redis with key `vtpass:electricity:catalogue` and TTL of 1 hour (`3600s`).
   - Invalidate the Redis cache key whenever an admin updates provider availability flags or coverage notes.

3. **Client Contract Enforcement**:
   - `serviceID` matches VTpass service identifiers exactly (`ikeja-electric`, `portharcourt-electric`, `aba-electric`, `eko-electric`, `abuja-electric`, etc.).
   - `states.providerIds` entries must match `providers.serviceID`.
