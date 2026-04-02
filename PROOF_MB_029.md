# MB-029 OLN Resolution Engine Proof

## 1. Generating an OLID
- Entity: Luke Skywalker (Franchise: SW)
- Resulting OLID: `oln-sw-luke-skywalker`

## 2. Resolving to the Same ID
- Input 'Luke Skywalker': `oln-sw-luke-skywalker`
- Input 'Skywalker, Luke': `oln-sw-luke-skywalker`
- Input 'Farmboy' (alias): `oln-sw-luke-skywalker`

## 3. Handling a New Entity
- Input 'Ahsoka Tano': `oln-sw-ahsoka-tano`

## 4. Cache Check
Check `data/oln/resolution_cache.json` for persistence.
