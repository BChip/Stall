import React, { useEffect, useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Home from "~home";
import Login from "~login";
import AuthRoute from './authroute';
import { auth } from './config';
import {
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth"

setPersistence(auth, browserLocalPersistence)

export interface IApplicationProps {}

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
