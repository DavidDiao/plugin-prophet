import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import Inspector from 'react-inspector'
import _ from 'lodash'
import {Grid, Row, Col, Button, Form, FormGroup, ControlLabel, FormControl} from 'react-bootstrap'
import {join} from 'path'
// import fs from 'fs-extra'
import { connect } from 'react-redux'
import { promisifyAll } from 'bluebird'
const fs = promisifyAll (require ('fs-extra'))
const CSON = promisifyAll(require('cson'))
import {store} from 'views/create-store'

import BattleViewArea from './views/battle-view-area'
import NextSpotInfo from './views/next-spot-info'


import {PacketManager, Simulator} from './lib/battle'

const { i18n } = window
const __ = i18n["poi-plugin-prophet-testing"].__.bind(i18n["poi-plugin-prophet-testing"])

// information related to spot info, will move to utils or something later

const spotInfo = {
  '0': '',
  '1': 'Start',
  '2': 'Unknown',
  '3': 'Obtain Resources',
  '4': 'Lose Resources',
  '5': 'Battle',
  '6': 'Boss Battle',
  '7': 'Battle Avoid',
  '8': 'Air Strike',
  '9': 'Escort Success',
  '10': 'Transport Munitions',
  '11': 'Long Distance Aerial Battle', //長距離空襲戦
  '12': 'Manual Selection',
  '13': 'Aerial Recon',
  '14': 'Night Battle',
  '15': 'Enemy Combined Fleet',
}

// give spot kind according to api_event_id and api_event_kind
// update according to https://github.com/andanteyk/ElectronicObserver/blob/1052a7b177a62a5838b23387ff35283618f688dd/ElectronicObserver/Other/Information/apilist.txt
const getSpotKind = (api_event_id, api_event_kind) => {
  console.log(api_event_id, api_event_kind)
  if (api_event_id == 4){ //4=通常戦闘
    if (api_event_kind == 2) return 14 //2=夜戦
    if (api_event_kind == 4) return 9 //4=航空戦
    if (api_event_kind == 5) return 15 //5=敵連合艦隊戦
    if (api_event_kind == 6) return 11 //6=長距離空襲戦
  }
  if (api_event_id === 6) { //6=気のせいだった
    if (api_event_kind === 1) { //1="敵影を見ず。"
      return 10
    } else if (api_event_kind === 2) { // 2=能動分岐
      return 12
    }
  } else if (api_event_id === 7) { //7=航空戦or航空偵察
    if (api_event_kind === 0) { //4=航空戦
      return 13
    }
  }
  return api_event_id + 1
}


// extracts necessary information from its stages, returns a new simulator
// infomation: 
const synthesizeStage = (simulator) => {
  _.each(simulator.stages, (stage) => {

  })
}



// reducer for mapspot and maproute data
export const reducer = (state, action) => {
  if (state == null) {
    state = {}
  }
  if (action.type === '@@poi-plugin-prophet/updateMapspot') {
    return ({
      ...state,
      mapspot: action.data,
    })
  }
  if (action.type === '@@poi-plugin-prophet/updateMaproute') {
    return ({
      ...state,
      maproute: action.data,
    })
  }
  return state
}


// sortiePhase
// 0: port, switch on when /kcsapi/api_port/port
// 1: before battle, switch on when /kcsapi/api_req_map/start or /kcsapi/api_req_map/next
// 2: battle/practice, switch on with PacketManager's emit



export const reactClass = connect(
  (state) => {
    const sortie = state.sortie || {} 
    return {
      sortie,
    }
  }
)(class Prophet extends Component {
  constructor(){
    super()
    this.state ={
      simulator:{},
      sortiePhase: 0,
      spotKind: '',
    }
  }

  componentWillMount() {
    fs.readFileAsync(join(__dirname, 'assets', 'data', 'mapspot.cson'))
    .then ((data) =>{
      const mapspot = CSON.parseCSONString(data)
      store.dispatch({
        type: '@@poi-plugin-prophet/updateMapspot',
        data: mapspot,
      })
    })
    .catch ((e) => console.log('Failed to load map data!', e.stack))

    fs.readFileAsync(join(__dirname, 'assets', 'data', 'maproute.cson'))
    .then ((data) =>{
      const mapspot = CSON.parseCSONString(data)
      store.dispatch({
        type: '@@poi-plugin-prophet/updateMaproute',
        data: mapspot,
      })
    })
    .catch ((e) => console.log('Failed to load map route!', e.stack))
  }

  componentDidMount() {
    // initialize PacketManager
    this.pm = new PacketManager()
    this.pm.addListener('battle', this.handlePacket)
    this.pm.addListener('result', this.handlePacket)

    // initialize repsonse listener
    window.addEventListener('game.response', this.handleGameResponse)
  }

  componentWillUnmount() {
    this.pm.removeListener('battle', this.handlePacket)
    this.pm.removeListener('result', this.handlePacket)

    window.removeEventListener('game.response', this.handleGameResponse)
  }

  testProphet = (e) => {
    const fpath = join(__dirname, 'test', ReactDOM.findDOMNode(this.fileName).value +'.json')
    try {
      fs.accessSync(fpath)
    
      const data = fs.readJsonSync(fpath)
      this.handlePacket(data)
    }
    catch(err) {
      console.log(err)
    }
  }


  handlePacket = (e) => {
    let simulator = new Simulator(e.fleet, {usePoiAPI: true})
    fs.outputJson(join(__dirname, 'test', Date.now()+'.json'), e, (err)=> {if (err != null) console.log(err)})
    let stages = _.flatMap(e.packet, (packet) => simulator.simulate(packet) )
    this.setState({
      sortiePhase: 2,
      simulator,
    })
  }

  handleGameResponse = (e) => {
    const {path, body, postBody} = e.detail

    // used in determining next spot type
    let {api_event_kind, api_event_id} = body

    switch(path){

    case '/kcsapi/api_port/port':
      this.setState({
        sortiePhase: 0,
        simulator: {},
      })
      break

    case '/kcsapi/api_req_map/start':
    case '/kcsapi/api_req_map/next':
      // here just determines next spot kind, as we also use store.sortie
      // use string to represent next spot type

      this.setState({
        sortiePhase: 1,
        spotKind: spotInfo[getSpotKind(api_event_id, api_event_kind)] || '',
      })
      break
    }


  }

  render() {
    return (
      <div id="plugin-prophet">
      <link rel="stylesheet" href={join(__dirname, 'assets', 'prophet.css')} />
        <Grid>
        <Row>
          <Col xs={12}>
            <BattleViewArea simulator={this.state.simulator || {}}/>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <NextSpotInfo spotKind={this.state.spotKind}/>
          </Col>
        </Row>
          <Row>
            <Col xs={12}>
              <Inspector data={this.state}/>
              <Inspector data={this.props}/>
            </Col>
          </Row>
        </Grid>
        <Row>
          <Col>
              <Form inline>
                <FormGroup controlId="formInlineEmail">
                  <ControlLabel>Timestamp</ControlLabel>
                  <FormControl type="number" ref={(ref) => this.fileName = ref}/>
                </FormGroup>
                <Button onClick={this.testProphet}>
                  Simulate
                </Button>
              </Form>
          </Col>
        </Row>
      </div>
      )
  }
})
