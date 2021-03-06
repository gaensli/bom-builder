import './popup.css'

import React from 'react'
import * as semantic from 'semantic-ui-react'
import immutable from 'immutable'

function getSkuUrl(vendor, sku) {
  switch (vendor) {
    case 'Farnell':
      return 'https://uk.farnell.com/' + sku
    case 'Mouser':
      return 'https://mouser.com/ProductDetail/' + sku
    case 'Newark':
      return 'https://www.newark.com/' + sku
    case 'Digikey':
      return 'https://www.digikey.co.uk/products/en?keywords=' + sku
    case 'RS':
      return 'https://uk.rs-online.com/web/c/?searchTerm=' + sku
    case 'Rapid':
      return 'https://www.rapidonline.com/Catalogue/Search?Query=' + sku
    default:
      return '#'
  }
}
class Popup extends React.PureComponent {
  constructor(props, ...args) {
    super(props, ...args)
    const viewing = props.selected < 0 ? 0 : props.selected
    this.state = {
      viewing,
      initialViewing: viewing
    }
    this.incrementViewing = this.incrementViewing.bind(this)
    this.decrementViewing = this.decrementViewing.bind(this)
    this.setViewing = this.setViewing.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.toggleExpanded = this.toggleExpanded.bind(this)
  }
  UNSAFE_componentWillReceiveProps(newProps) {
    if (
      newProps.suggestions &&
      !newProps.suggestions.equals(this.props.suggestions)
    ) {
      const viewing = newProps.selected < 0 ? 0 : newProps.selected
      this.setViewing(viewing)
    }
  }
  toggleExpanded() {
    this.props.setExpanded(!this.props.expanded)
  }
  handleClose() {
    if (this.props.selected >= 0) {
      this.setState({viewing: this.props.selected})
    }
    this.props.onClose && this.props.onClose()
  }
  incrementViewing() {
    this.setViewing(this.state.viewing + 1)
  }
  decrementViewing() {
    this.setViewing(this.state.viewing - 1)
  }
  setViewing(n) {
    const suggestions = this.props.suggestions
    if (n >= suggestions.size) {
      n = 0
    } else if (n < 0) {
      if (suggestions.size === 0) {
        n = 0
      } else {
        n = suggestions.size - 1
      }
    }
    this.setState({viewing: n})
  }
}

class SkuPopup extends Popup {
  constructor(props, ...args) {
    super(props, ...args)
    this.toggleSelected = this.toggleSelected.bind(this)
  }
  toggleSelected() {
    const {selected, remove, setField, suggestions, lineId, field} = this.props
    if (selected === this.state.viewing) {
      remove(immutable.List.of(lineId, field))
    } else {
      const value = suggestions.getIn([this.state.viewing, 'sku', 'part'])
      setField({lineId, field, value})
    }
  }
  render() {
    const props = this.props
    const suggestions = props.suggestions
    const popupProps = {
      className: 'Popup',
      flowing: true,
      position: props.position,
      trigger: props.trigger,
      onOpen: props.onOpen,
      onClose: this.handleClose,
      open: props.open,
      offset: props.offset,
      keepInViewPort: false,
      on: props.on
    }
    const suggestion = suggestions.get(this.state.viewing) || immutable.Map()
    const partData = suggestion.get('partData') || immutable.Map()
    const image =
      suggestion.get('image') || partData.get('image') || immutable.Map()
    const sku = suggestion.get('sku') || immutable.Map()
    const mpn = suggestion.get('mpn') || immutable.Map()
    const part = sku.get('part') || props.value
    const vendor = sku.get('vendor') || props.field.last()
    const inStock = suggestion.get('in_stock_quantity')
    const stockLocation = suggestion.get('stock_location')
    const checkColor = suggestion.get('checkColor')
    const expanded = mpn.get('part') && this.props.expanded

    let stockInfo = []
    if (inStock != null) {
      const checkIcon = (
        <semantic.Icon
          name={checkColor === 'red' ? 'close' : 'check'}
          style={{marginLeft: 10}}
          color={checkColor}
          key="checkIcon"
        />
      )
      stockInfo = [
        immutable.Map({
          name: ['Stock'],
          value: [inStock, checkIcon]
        })
      ]
      if (stockLocation) {
        stockInfo.push(
          immutable.Map({
            name: 'Location',
            value: stockLocation
          })
        )
      }
    }
    stockInfo.push(
      immutable.Map({name: <div style={{minHeight: 30}} />, value: ''})
    )
    stockInfo = immutable.List(stockInfo)
    const skuTitle = (
      <div>
        <Title
          one={
            <a
              href={getSkuUrl(vendor || props.field.pop(), part || props.value)}
            >
              {part || props.value}
            </a>
          }
          page={
            suggestions.size
              ? `${this.state.viewing + 1}/${suggestions.size}`
              : ''
          }
          wandColor={suggestion.get('type')}
          hideWand={!mpn.get('part')}
        />
        <div className="subTitle">
          {mpn.get('part')
            ? mpn.get('manufacturer') + ' - ' + mpn.get('part')
            : ''}
        </div>
      </div>
    )
    const priceTable = (
      <SpecTable
        specs={stockInfo.concat(pricesToSpecs(suggestion.get('prices')))}
      />
    )
    let specs = partData.get('specs') || immutable.List()
    return (
      <semantic.Popup {...popupProps}>
        <Buttons
          disabled={suggestions.size < 2}
          selectDisabled={suggestions.size < 1}
          selected={this.props.selected === this.state.viewing}
          onIncrement={this.incrementViewing}
          onDecrement={this.decrementViewing}
          onSelect={this.toggleSelected}
        />
        {skuTitle}
        <div className="topAreaContainer">
          <div className="topAreaInner">
            <div>
              <div className="imageContainer">
                <semantic.Image src={image.get('url')} />
              </div>
              <a className="imageCredit" href={image.get('credit_url')}>
                {image.get('credit_string')}
              </a>
            </div>
            <div className="octopartLinkContainer">
              <a
                href={
                  'https://octopart.com' + (part ? `/search?q=${part}` : '')
                }
              >
                Powered by Octopart
              </a>
            </div>
          </div>
          <div className="leftHandModule">
            <div
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'center',
                marginBottom: 10
              }}
            >
              <semantic.Button
                style={{display: expanded ? 'initial' : 'none'}}
                onClick={this.toggleExpanded}
                size="tiny"
                basic={true}
              >
                {expanded ? '⭬' : '...'}
              </semantic.Button>
            </div>
            {expanded && (
              <div>
                <div style={{cursor: 'pointer'}} className="description">
                  {partData.get('description')}
                </div>
                <Datasheet href={partData.get('datasheet')} />
                <SpecTable specs={specs} />
              </div>
            )}
          </div>
          <div className="rightHandModule">
            {!expanded && (
              <div className="description" style={{cursor: 'pointer'}}>
                {partData.get('description')}
              </div>
            )}
            <semantic.Button
              style={{
                visibility: expanded || !mpn.get('part') ? 'hidden' : 'visible'
              }}
              onClick={this.toggleExpanded}
              size="tiny"
              basic={true}
            >
              {this.props.expanded ? '⭬' : '...'}
            </semantic.Button>
            <Datasheet href={suggestion.get('datasheet')} />
            {priceTable}
          </div>
        </div>
      </semantic.Popup>
    )
  }
}

class MpnPopup extends Popup {
  constructor(props, ...args) {
    super(props, ...args)
    this.toggleSelected = this.toggleSelected.bind(this)
  }
  toggleSelected() {
    const {selected, remove, setField, suggestions, lineId, field} = this.props
    if (selected === this.state.viewing) {
      remove(immutable.List.of(lineId, field))
    } else {
      const mpn = suggestions.getIn([this.state.viewing, 'mpn'])
      setField({lineId, field, value: mpn})
    }
  }
  render() {
    const props = this.props
    const suggestions = props.suggestions
    const popupProps = {
      className: 'Popup',
      flowing: true,
      position: props.position,
      trigger: props.trigger,
      onOpen: props.onOpen,
      onClose: this.handleClose,
      open: props.open,
      offset: props.offset,
      keepInViewPort: false,
      on: props.on
    }
    const suggestion = suggestions.get(this.state.viewing) || immutable.Map()
    const image = suggestion.get('image') || immutable.Map()
    const mpn = suggestion.get('mpn') || immutable.Map()
    const part = mpn.get('part') || ''
    let specs = suggestion.get('specs') || immutable.List()
    if (!this.props.expanded) {
      specs = specs.slice(0, 4)
    }
    const mpnTitle = (
      <Title
        one={mpn.get('manufacturer')}
        two={part}
        page={`${this.state.viewing + 1}/${suggestions.size}`}
        wandColor={suggestion.get('type')}
      />
    )
    const specTable = <SpecTable specs={specs} />
    let expandButton
    if (suggestion.get('specs') && suggestion.get('specs').size > 4) {
      expandButton = (
        <div className="expandButtonContainer">
          <semantic.Button
            onClick={this.toggleExpanded}
            size="tiny"
            basic={true}
          >
            {this.props.expanded ? '⇡' : '...'}
          </semantic.Button>
        </div>
      )
    }
    return (
      <semantic.Popup {...popupProps}>
        <Buttons
          disabled={suggestions.size < 2}
          selected={this.props.selected === this.state.viewing}
          onIncrement={this.incrementViewing}
          onDecrement={this.decrementViewing}
          onSelect={this.toggleSelected}
        />
        {mpnTitle}
        <div className="topAreaContainer">
          <div className="topAreaInner">
            <div>
              <div className="imageContainer">
                <semantic.Image src={image.get('url')} />
              </div>
              <a className="imageCredit" href={image.get('credit_url')}>
                {image.get('credit_string')}
              </a>
            </div>
            <div className="octopartLinkContainer">
              <a
                href={
                  'https://octopart.com' + (part ? `/search?q=${part}` : '')
                }
              >
                Powered by Octopart
              </a>
            </div>
          </div>
          <div className="rightHandModule">
            <div className="description">{suggestion.get('description')}</div>
            <Datasheet href={suggestion.get('datasheet')} />
            {specTable}
            {expandButton}
          </div>
        </div>
      </semantic.Popup>
    )
  }
}

class Datasheet extends React.PureComponent {
  render() {
    const link = this.props.href ? (
      <a href={this.props.href}>
        <semantic.Icon name="file pdf outline" />
        Datasheet
      </a>
    ) : null
    return <div className="datasheet">{link}</div>
  }
}

class SpecTable extends React.PureComponent {
  render() {
    const specTableData = this.props.specs.map(spec => [
      spec.get('name'),
      spec.get('value')
    ])
    return (
      <semantic.Table
        className="specTable"
        unstackable
        basic="very"
        compact={true}
        tableData={specTableData.toArray()}
        renderBodyRow={args => {
          return (
            <tr key={String(args)}>
              {args.map(text => <td key={String(text)}>{text}</td>)}
            </tr>
          )
        }}
      />
    )
  }
}

function pricesToSpecs(prices) {
  if (!prices) {
    return immutable.List()
  }
  const gbp = prices.get('GBP')
  const eur = prices.get('EUR')
  const usd = prices.get('USD')
  const symbol = gbp ? '£' : eur ? '€' : usd ? '$' : ''
  return (gbp || eur || usd || []).map(price =>
    immutable.Map({name: price.get(0), value: symbol + price.get(1)})
  )
}

class Title extends React.PureComponent {
  render() {
    const props = this.props
    const wandOpacity = /match/.test(props.wandColor) ? 1.0 : 0.3
    return (
      <div className="titleContainer">
        <div>
          {!props.hideWand && (
            <semantic.Icon
              style={{opacity: wandOpacity}}
              color={/match/.test(props.wandColor) ? 'green' : 'grey'}
              name={props.wandColor === 'match' ? 'magic' : 'search'}
            />
          )}
        </div>
        <div className="mpnTitle">
          <div>{props.one}</div>
          <div>{props.two}</div>
        </div>
        <div className="viewingNumber">{props.page}</div>
      </div>
    )
  }
}

class Buttons extends React.PureComponent {
  render() {
    const {
      disabled,
      selected,
      onDecrement,
      onIncrement,
      onSelect,
      selectDisabled
    } = this.props
    return (
      <semantic.Button.Group size="tiny" basic fluid>
        <semantic.Button
          disabled={disabled}
          icon="left chevron"
          onClick={onDecrement}
        />
        <semantic.Button disabled={selectDisabled} onClick={onSelect}>
          <semantic.Icon name={selected ? 'checkmark box' : 'square outline'} />
          {selected ? 'Selected' : 'Select'}
        </semantic.Button>
        <semantic.Button
          disabled={disabled}
          icon="right chevron"
          onClick={onIncrement}
        />
      </semantic.Button.Group>
    )
  }
}

export {MpnPopup, SkuPopup}
