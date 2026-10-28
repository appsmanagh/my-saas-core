import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import type { AuthService } from "../../auth/auth-service";

//19. se importa este module para el logout
import {
 extractSessionToken
} from "../session-token";


// 24. se importa el auth validation 
import {
  validateLoginInput,
  validateRegisterInput,
} from "../validation/auth-validation";

export function createAuthRoutes(
  authService: AuthService,
  requireAuth: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => Promise<void>,
) {
  const router = Router();

  //19. este es uno de los primeros endpoints
  router.post(
    "/register",
    async (request, response, next) => {
      try {
         //24 usamos aqui el validateRegisterInput
        const input =
        validateRegisterInput(request.body);
        
        // 24. y aqui lo usamos el input
        const user =
        await authService.register(input);
        //24. y esto es el code reemplazado
        // const {
        //   email,
        //   name,
        //   password,
        // } = request.body;

        // const user =
        //   await authService.register({
        //     email,
        //     name,
        //     password,
        //   });

        response.status(201).json({
          user,
        });
      } catch (error) {
        next(error);
      }
    },
  );
//19. este es uno de los primeros endpoints
  router.post(
    "/login",
    async (request, response, next) => {
      try {

        //24 usamos aqui el validateRegisterInput
        const input =
        validateLoginInput(request.body);

         // 24. y aqui lo usamos el input
        const result = await authService.login({
          ...input,
          ip: request.ip ?? "unknown",
        });
        //24. y esto es el code reemplazado
        // const {
        //   email,
        //   password,
        //   ip
        // } = request.body;

        // //21. aqui se agrega el parameter ip para manejar loginRateLimit
        // const result =
        // await authService.login({
        //   email,
        //   password,
        //   ip: request.ip,
        // });

        response.cookie(
          "session_token",
          result.token,
          {
            httpOnly: true,
            secure:
              process.env.NODE_ENV ===
              "production",
            sameSite: "lax",
            expires: result.expiresAt,
          },
        );

        response.status(200).json({
          user: result.user,
        });
      } catch (error) {
        next(error);
      }
    },
  );

// 19.  ¿Qué recibe realmente el navegador?

//     Cuando hacemos login:

//     POST /api/auth/login

//     el servidor NO devuelve:

//     {
//     "token": "abc123"
//     }

//     como parte normal de nuestra respuesta.

//     En cambio manda:

//     Set-Cookie: session_token=abc123...

//     con:

//     HttpOnly
//     Secure
//     SameSite=Lax
//     Expires

//     Y el navegador guarda esa cookie.

//     Nuestro JavaScript no necesita hacer:

//     localStorage.setItem(...)

//     ni manejar manualmente el token.

  router.get(
    "/me",
    requireAuth,
    async (request, response, next) => {
      try {
        response.status(200).json({
          user: request.user,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // 19. Pero aquí nos encontraremos con un problema de TypeScript:

// request.user

// no existe en el tipo estándar de Express.

// Y esto es bueno.

// TypeScript nos está diciendo:

// "Oye, tú acabas de inventarte una propiedad que Express no conoce." 😄

        // Extendemos Express.Request

        // Crea:

        // api/express.d.ts

    //19. este es el endpoint de lodout

    router.post(
        "/logout",
        async(request,response,next)=>{

            try {

            const token =
                extractSessionToken(request);

            if(token){
                await authService.logout(token);
            }


            response.clearCookie(
                "session_token",
            );


            response.status(200).json({
                message:"Logged out",
            });


            }catch(error){
            next(error);
            }

        }
    );

  return router;
}