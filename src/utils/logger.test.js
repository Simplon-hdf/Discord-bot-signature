import logger from './logger';
import { describe, it, expect, vi } from 'vitest';

describe('Logger', () => {
    it('should log info messages', () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation();
        logger.info('Test info message');
        expect(logSpy).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Test info message'));
        logSpy.mockRestore();
    });

    it('should log error messages', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation();
        logger.error('Test error message');
        expect(errorSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error message'));
        errorSpy.mockRestore();
    });
}); 