'use client';

import React from "react";
import { ButtonHTMLAttributes } from 'react';
import { useAuth } from "../useAuth";

interface LoginWithDashnexButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export const LoginWithDashnexButton = ({ 
  className,
  ...props 
}: LoginWithDashnexButtonProps) => {
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <button 
      onClick={handleLogin}
      disabled={isLoading}
      className={className}
      aria-label="Sign in with DashNex"
      type="button"
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
          Signing in...
        </>
      ) : (
        "Sign In with DashNex"
      )}
    </button>
  );
};