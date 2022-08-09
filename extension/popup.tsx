import { browserLocalPersistence, setPersistence } from "firebase/auth"
import React from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import AuthRoute from "./components/authroute"
import Login from "./components/login"
import { auth } from "./config"
import Home from "./home"

setPersistence(auth, browserLocalPersistence)

function IndexPopup() {
  return (
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AuthRoute>
              <Home />
            </AuthRoute>
          }
        />
        <Route path="/login" element={<Login />} />
      </Routes>
    </MemoryRouter>
  )
}

export default IndexPopup
