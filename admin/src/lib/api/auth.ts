/**
 * Auth API Functions
 *
 * Typed API functions for authentication endpoints.
 */
import type { ApiResponse } from '@/types/api';
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutResponse,
} from '@/types/auth';
import { post } from './client';

/**
 * Login with username and password.
 *
 * @param username - Username
 * @param password - Password
 * @returns Login response with tokens
 */
export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const body: LoginRequest = { username, password };
  const response = await post<ApiResponse<LoginResponse>>('/auth/login', body, {
    skipAuth: true,
  });
  return response.data;
}

/**
 * Refresh access token using refresh token.
 *
 * @param refreshToken - Current refresh token
 * @returns New access token and expiry
 */
export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const body: RefreshRequest = { refreshToken };
  const response = await post<ApiResponse<RefreshResponse>>('/auth/refresh', body, {
    skipAuth: true,
  });
  return response.data;
}

/**
 * Logout (client-side only, server returns success).
 */
export async function logout(): Promise<void> {
  await post<ApiResponse<LogoutResponse>>('/auth/logout');
}
