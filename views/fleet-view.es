import {getShipName, getItemName} from './utils'
import FontAwesome from 'react-fontawesome'
import {join} from 'path'
import React, {Component} from 'react'
const { ROOT, $ships, $slotitems} = window
import {Panel, Grid, Row, Col, OverlayTrigger, Tooltip} from 'react-bootstrap'
import {SlotitemIcon} from 'views/components/etc/icon'
import {FABar, HPBar} from './bar'

import ShipView from './ship-view'

const { i18n } = window
const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

export default class FleetView extends React.Component {
  static defaultProps = {
    count: 1,
    fleet: {},
    title: '',
    View: null,
  }

  render() {
    let {fleet, View} = this.props
    if (! (fleet && fleet.length > 0)) {
      return <div />
    }
    if (View == null) {
      View = ShipView
    }
    return (
      <div className="fleet-view">
        <div>
        {fleet.map((ship, i) =>
          <View child={ship} key={i}/>
        )}
        </div>
      </div>
    )
  }
}