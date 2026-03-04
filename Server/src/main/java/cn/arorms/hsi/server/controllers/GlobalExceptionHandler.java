package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.exceptions.InvalidMessageException;
import org.hibernate.PropertyValueException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Return an internal server error when message in redis is invalid
     * @param e invalid message exception
     * @return error message
     */
    @ExceptionHandler(InvalidMessageException.class)
    public ResponseEntity<String> handleInvalidMessageError(InvalidMessageException e) {
        return ResponseEntity.internalServerError().body("Internal error: " + e.getMessage());
    }

    /**
     * Return database operation error
     * @param e exception thrown from database operation
     * @return bad request if the request of creating an entity is invalid
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDatabaseError(DataIntegrityViolationException e) {

        if (e.getCause() instanceof PropertyValueException propertyValueException) {
            return ResponseEntity.badRequest().body("Property '" + propertyValueException.getPropertyName() + "' cannot be null.");
        }

        return ResponseEntity.internalServerError().body("Internal error.");
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> handleNoSuchElementError(NoSuchElementException e) {
        return ResponseEntity.notFound().build();
    }
}
