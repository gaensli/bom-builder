import React from 'react'
import * as semantic from 'semantic-ui-react'
import * as reactRedux from 'react-redux'
import * as redux from 'redux'
import immutable from 'immutable'
import oneClickBom from '1-click-bom'

import {actions} from './state'
import {retailerSelectionNumbers, getPurchaseLines} from './bom'

const retailer_list = oneClickBom
  .getRetailers()
  .filter(r => r !== 'Rapid')

function BuyParts(props) {
  const retailers = props.selectionNumbers
    .sort((a, b) => b - a)
    .map((v, r) => {
      if (v > 0) {
        return (
          <semantic.List.Item key={r}>
            <semantic.List.Header>{r}</semantic.List.Header>
            {v}
          </semantic.List.Item>
        )
      }
    })
    .valueSeq()
    .toJS()
  const messages = props.buyPartsMessages.map(message => {
    const vendor = message.getIn(['sku', 'vendor'])
    const title = `Problem with adding part to ${vendor} cart`
    const part = message.getIn(['sku', 'part'])
    if (part == null) {
      return (
        <semantic.Message key={title} negative>
          <semantic.Message.Header>{title}</semantic.Message.Header>
        </semantic.Message>
      )
    }
    let reference = message.get('reference')
    if (reference.length > 20) {
      reference = reference.slice(0, 20) + '...'
    }
    const messageBody = `"${reference}": ${part}`
    return (
      <semantic.Message key={title + messageBody} negative>
        <semantic.Message.Header>{title}</semantic.Message.Header>
        {messageBody}
      </semantic.Message>
    )
  })

  return (
    <div style={{display: 'flex', alignItems: 'center'}}>
      <div>
        <semantic.Button
          onClick={props.autoFillSuggestions}
          className="buyPartsButton"
          color="green"
          basic
        >
          <semantic.Icon name="magic" />
          <semantic.Icon name="search" />
          Auto Fill
        </semantic.Button>
      </div>
    </div>
  )
}

function mapDispatchToProps(dispatch) {
  return redux.bindActionCreators(actions, dispatch)
}

function mapStateToProps(state) {
  const extensionPresent = state.view.get('extensionPresent')
  let lines = state.data.present.get('lines')
  const loading = state.suggestions.reduce(
    (prev, s) => prev || s.get('status') === 'loading',
    false
  )
  let selectionNumbers = immutable.Map()
  if (!loading) {
    const purchaseLines = getPurchaseLines(state)
    selectionNumbers = retailerSelectionNumbers(purchaseLines)
  }
  return {
    selectionNumbers,
    extensionPresent,
    preferredRetailer: state.view.get('preferredRetailer'),
    previewBuy: state.view.get('previewBuy'),
    buyPartsMessages: state.view.get('buyPartsMessages')
  }
}

export default reactRedux.connect(mapStateToProps, mapDispatchToProps)(BuyParts)
