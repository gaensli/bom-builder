const superagent = require('superagent')
const ramda      = require('ramda')

const partinfoURL = 'https://partinfo.kitnic.it/graphql'

const part = `
  mpn {
    manufacturer
    part
  }
  datasheet
  description
  image {
    url
    credit_string
    credit_url
  }
  specs {
    key
    name
    value
  }
`

const MpnQuery = `
query MpnQuery($input: MpnInput!) {
  part(mpn: $input) {
    ${part}
  }
}`

const SkuQuery = `
query SkuQuery($input: SkuInput!) {
  part(sku: $input) {
    ${part}
  }
}`

function post(mpnOrSku) {
  let query = MpnQuery
  if (mpnOrSku.vendor) {
    query = SkuQuery
  }

  if (!mpnOrSku.part || mpnOrSku.part === '') {
    return Promise.resolve(null)
  }

  return superagent
    .post(partinfoURL)
    .set('Accept', 'application/json')
    .send({
      query,
      variables: {
        input: mpnOrSku
      },
    }).then(res => {
      return res.body.data.part
    }).catch(err => {
      console.error(err)
      return null
    })

}

function getPartinfo(lines) {
  const requests = lines.map(line => {
    return Promise.all(line.partNumbers.map(post))
  })
  return Promise.all(requests).then(ramda.flatten)
    .then(parts => parts.filter(x => x != null))
}

module.exports = {post}
