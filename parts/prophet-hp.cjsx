{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap

getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

getLineStyle = (flag) ->
  if flag
    'friend-hp'
  else
    'enemy-hp'

module.exports = React.createClass
  render: ->
    if @props.ship.id == -1
      <td>　</td>
    else
      <td className="hp-progress" style={opacity: 1 - 0.6 * @props.ship.back}>
        <div className={getLineStyle @props.ship.owner != 1 && (@props.ship.hp.now * 4 - @props.ship.hp.max > 0)}>
          <ProgressBar bsStyle={getHpStyle @props.ship.hp.now / @props.ship.hp.max * 100}
            now={@props.ship.hp.now / @props.ship.hp.max * 100}
            label={if @props.ship.hp.injure > 0 then "#{@props.ship.hp.now} / #{@props.ship.hp.max} (-#{@props.ship.hp.injure})" else "#{@props.ship.hp.now} / #{@props.ship.hp.max}"} />
          <div className='red-line' />
        </div>
      </td>
