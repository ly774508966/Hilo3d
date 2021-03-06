#ifdef HILO_IGNORE_TRANSPARENT
color.a = 1.0;
#endif

color.rgb *= color.a;

#ifdef HILO_GAMMA_OUTPUT
    color.rgb = pow(color.rgb, vec3(u_gammaFactor));
#endif

#ifdef HILO_USE_HDR
    color.rgb = vec3(1.0) - exp(-color.rgb * u_exposure);
#endif

gl_FragColor = color;