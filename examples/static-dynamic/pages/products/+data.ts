import { loadDummyJsonProducts } from '../../dummyjsonProducts'

export { data }

async function data() {
  return {
    products: await loadDummyJsonProducts(),
  }
}
