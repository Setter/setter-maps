import React, { useState, useEffect } from 'react'
import ReactMapGL, { Marker } from 'react-map-gl'

import socketIOClient from 'socket.io-client'
import { Statistic } from 'antd'

import 'antd/dist/antd.css'
import './App.css'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiamVmZnpoNG5nIiwiYSI6ImNrNDM1anNpYTA0Z3IzbHQ0MmE2aXI2dnAifQ.uoYWInoTMb6Xrzh7kApmRA'

const App = () => {
  const [viewport, setViewport] = useState({
    width: 1300,
    height: 700,
    latitude: 43.6532,
    longitude: -79.3832,
    zoom: 8,
  })

  const [pulseCoordinates, setPulseCoordinates] = useState([])
  const [houseCoordinates, setHouseCoordinates] = useState([])
  const [dailyValue, setDailyValue] = useState(0)

  useEffect(() => {
    const socket = socketIOClient('https://setter.ngrok.io/')
    socket.on('QUOTE_APPROVED', data => {
      const newCoordinates = data.quotes.map(quote => {
        const { lat, lng } = quote.coordinates
        return {
          placed: Date.now(),
          lat,
          lng,
        }
      })

      const totalValueOfQuotes = data.quotes.reduce((totalSum, quote) => totalSum + quote.quote_value / 100, 0)

      setDailyValue(prevValue => prevValue + totalValueOfQuotes)
      setPulseCoordinates(prevCoordinates => [...prevCoordinates, ...newCoordinates])
      setHouseCoordinates(prevCoordinates => [...prevCoordinates, ...newCoordinates])
    })
  }, [])

  useEffect(() => {
    setInterval(() => {
      setPulseCoordinates(prevCoordinates => {
        const dateNow = new Date()
        const dateThreeSecondsAgo = new Date(dateNow.getTime() - 3 * 1000)
        const newCoordinates = prevCoordinates.filter(prevCoordinate => prevCoordinate.placed > dateThreeSecondsAgo)
        return newCoordinates
      })
    }, 1000)
  }, [])

  return (
    <>
      <ReactMapGL
        mapboxApiAccessToken={MAPBOX_TOKEN}
        {...viewport}
        onViewportChange={viewport => setViewport(viewport)}
      >
        {renderPulses(pulseCoordinates)}
        {renderHouses(houseCoordinates)}
      </ReactMapGL>
      <div className="daily-total">
        <Statistic value={dailyValue} precision={2} />
        <h1 className="daily-total-divider">/</h1>
        <Statistic value={100000} precision={2} />
      </div>
    </>
  )
}

const renderHouses = coordinates =>
  coordinates.map(coordinate => {
    const { lat, lng } = coordinate
    return (
      <Marker latitude={lat} longitude={lng} offsetLeft={-20} offsetTop={-10}>
        <i className="fas fa-house" />
      </Marker>
    )
  })

const renderPulses = coordinates =>
  coordinates.map(coordinate => {
    const { lat, lng } = coordinate
    return (
      <Marker latitude={lat} longitude={lng} offsetLeft={-20} offsetTop={-10}>
        <div className="circle" style={{ animationDelay: '-3s' }}></div>
        <div className="circle" style={{ animationDelay: '-2s' }}></div>
        <div className="circle" style={{ animationDelay: '-1s' }}></div>
        <div className="circle" style={{ animationDelay: '0s' }}></div>
      </Marker>
    )
  })

export default App
