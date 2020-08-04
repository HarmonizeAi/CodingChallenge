import {Request, Response, NextFunction, request} from "express"
import * as Joi from "@hapi/joi"
import {Schema} from "@hapi/joi"

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void> ) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      Promise.resolve(fn(req, res, next)).catch( (error) => {
        console.error(`ERROR in ${req.url} handler:`, error);
        next(error);
      });
    } catch (error) {
      console.error(`ERROR in ${req.url} handler:`, error);
      next(error);
    }
  };
};


export function buildValidator(schema: Schema, property: "body" | "params" | "query" = "body", stripUnknown: boolean = true, allowUnknown: boolean = false ) {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationResult = schema.validate( req[property], { abortEarly: false, stripUnknown, allowUnknown } )
    
    // 
    const valid = validationResult.error == null;

    if (valid) { 
      // replace the respective property on the request with the cleaned fields
      // so we do not pass through any unexpected parameters
      req[property] = validationResult.value
      next(); 
    } else { 
      const errorMap = joiErrorToMap(validationResult)
      const errObj = { validationErrors: { [property]: [...errorMap] } }

      console.debug(`${request.method} ${request.url} error:`, JSON.stringify(errObj))
      res.status(422).json(errObj) 
    }  
  }
}

function joiErrorToMap(validationResult: Joi.ValidationResult) {
  const errorMap = new Map<string, { message: string, path: (string | number) [], type: string, key?: string, label?: string }>()

  for(const detail of (validationResult?.error?.details ?? []) ) {
    const pathStr = detail.path.join(".");
    const cleanedMessage = detail?.message?.replace( `\"${pathStr}\"`, "")?.trim()
    errorMap.set(pathStr, {
      message: cleanedMessage,
    path: detail.path,
      type: detail.type,
      label: detail.context?.label,
      key: detail.context?.key
    })
  }

  return errorMap;
}