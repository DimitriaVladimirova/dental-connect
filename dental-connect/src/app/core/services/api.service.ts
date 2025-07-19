import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE_URL = 'http://localhost:3030';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(url: string): Observable<T> { return this.http.get<T>(BASE_URL + url); }
  post<T>(url: string, body: any): Observable<T> { return this.http.post<T>(BASE_URL + url, body); }
  put<T>(url: string, body: any): Observable<T> { return this.http.put<T>(BASE_URL + url, body); }
  patch<T>(url: string, body: any): Observable<T> { return this.http.patch<T>(BASE_URL + url, body); }
  delete<T>(url: string): Observable<T> { return this.http.delete<T>(BASE_URL + url); }
}
