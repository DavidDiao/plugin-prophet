import FontAwesome from 'react-fontawesome'
import React, { Component } from 'react'
import _ from 'lodash'
import { connect } from 'react-redux'

import ShipView from './ship-view'
import FleetView from './fleet-view'
import SquadView from './squad-view'
import BattleInfo from './battle-info'
import DropInfo from './drop-info'
import NextSpotInfo from './next-spot-info'

const { i18n } = window
const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

const BattleViewArea = connect(
  (state, props) => ({
    layout: _.get(state, 'config.poi.layout', 'horizontal'),
    doubleTabbed: _.get(state, 'config.poi.tabarea.double', false),
    ecGameOrder: _.get(state, 'config.plugin.prophet.ecGameOrder', true),
    mainFleet: props.mainFleet,
    escortFleet: props.escortFleet,
    enemyFleet: props.enemyFleet,
    enemyEscort: props.enemyEscort,
    landBase: props.landBase,
    airForce: props.airForce,
    airControl: props.airControl,
    isBaseDefense: props.isBaseDefense,
    sortieState: props.sortieState,
    spotKind: props.spotKind,
    result: props.result,
    api_formation: props.api_formation,
  })
)(class BattleViewArea extends Component {
  static defaultProps = {
    mainFleet: [], // An array of fleet
    escortFleet: [],
    enemyFleet: [],
    enemyEscort: [],
    landBase: [],
    airForce: [], // [count, lostCount, enemyCount, enemyLostCount]
    airControl: 0, // 0=制空均衡, 1=制空権確保, 2=航空優勢, 3=航空劣勢, 4=制空権喪失
    isBaseDefense: false,
    sortieState: 0, // 0: port, 1: before battle, 2: battle, 3: practice
    spotKind: '',
    result: {},
    api_formation: [], // [null, Formation, Engagement]
  }

  render() {
    const {
      layout,
      doubleTabbed,
      ecGameOrder,
      mainFleet,
      escortFleet,
      enemyFleet,
      enemyEscort,
      landBase,
      airForce,
      airControl,
      isBaseDefense,
      sortieState,
      spotKind,
      result,
      battleForm,
      eFormation,
    } = this.props
    let View = isBaseDefense ? SquadView : ShipView
    let friendTitle = isBaseDefense ? 'Land Base' : 'Sortie Fleet'
    let enemyTitle = sortieState == 3 ? 'PvP' : 'Enemy Vessel'
    const times = layout == 'horizontal' ? 1 : 2
    let useVerticalLayout = !doubleTabbed && layout !== 'horizontal'
    // adapt the view according to layout by setting FleetView's div xs = 12/count
    // this can support 12v6, 6v12 and 12v12
    let fleetCount = 1 && _.sumBy([mainFleet, escortFleet], (fleet) => fleet != null)
    let enemyCount = 1 && _.sumBy([enemyFleet, enemyEscort], (fleet) => fleet != null)
    let fleetWidth = escortFleet && !isBaseDefense ? 2 : 1
    let enemyWidth = enemyEscort && !isBaseDefense ? 2 : 1
    let {getShip, getItem} = _.pick(result, ['getShip', 'getItem'])
    const alliedForce =
      <div className="div-row">
        <FleetView fleet={isBaseDefense ? landBase : mainFleet} title={__('Main Fleet')} count={times * fleetCount} View={View}/>
        <FleetView fleet={isBaseDefense ? undefined : escortFleet} title={__('Escort Fleet')} count={times * fleetCount} View={View}/>
      </div>
    const enemyForce = sortieState > 1 || isBaseDefense ?
      <div className="div-row" style={{flexDirection: ecGameOrder ? 'row-reverse' : 'row'}}>
        <FleetView fleet={enemyFleet} title={__('Enemy Fleet')} count={times * enemyCount}/>
        <FleetView fleet={enemyEscort} title={__('Enemy Escort Fleet')} count={times * enemyCount}/>
      </div> : <noscript />
    const combatInfo = sortieState > 1 || isBaseDefense ?
      <div className='alert div-row prophet-info'>
        <div style={{flex: 1}}>
          {__(friendTitle) + ' '}
          {
            airForce[0] ?
              <span>
                <FontAwesome name='plane' />
                {` [${airForce[0] - airForce[1]} / ${airForce[0]}]`}
              </span> : ''
          }
        </div>
        <div style={{flex: 0}}>vs</div>
        <div style={{flex: 1}}>
          {
            airForce[2] ?
            <span>
              <FontAwesome name='plane' />
              {` [${airForce[2] - airForce[3]} / ${airForce[2]}]`}
            </span> : ''
          }
          {' ' + __(enemyTitle)}
        </div>
      </div> : <noscript />
    const mapInfo =
      <div className="alert prophet-info">
        {
          sortieState === 1 && !isBaseDefense ?
          <NextSpotInfo spotKind={spotKind}/>
          : isBaseDefense ?
          [
            <BattleInfo
              result = {result && result.rank }
              formation ={eFormation}
              intercept = {battleForm}
              seiku = {airControl}
            />,
            <span> | </span>,
            <NextSpotInfo spotKind={spotKind}/>,
          ]
          : (getShip || getItem) ?
          <DropInfo
            getShip = {getShip}
            getItem = {getItem}
          />
          : sortieState > 1 || isBaseDefense ?
          <BattleInfo
            result = {result && result.rank }
            formation ={eFormation}
            intercept = {battleForm}
            seiku = {airControl}
          />
          : <noscript />
        }
      </div>
    return (
      <div id="overview-area">
        {useVerticalLayout ? combatInfo : null}
        <div className={useVerticalLayout ? 'div-row' : ''}>
          <div className='fleet-container' style={{flex: useVerticalLayout ? fleetWidth : 1, flexDirection: useVerticalLayout && (escortFleet || []).length && !isBaseDefense ? 'column-reverse' : 'column'}}>
            {alliedForce}
            {!useVerticalLayout ? combatInfo : null}
          </div>
          <div className='fleet-container' style={{flex: useVerticalLayout ? enemyWidth : 1, flexDirection: useVerticalLayout && (enemyEscort || []).length ? 'column-reverse' : 'column'}}>
            {enemyForce}
            {!useVerticalLayout ? mapInfo : null}
          </div>
        </div>
        {useVerticalLayout ? mapInfo : null}
      </div>
    )
  }
})

export default BattleViewArea
