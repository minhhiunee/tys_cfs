import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { ForbiddenException } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard.js';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    hardDelete: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  describe('hardDelete', () => {
    it('should throw ForbiddenException if user is not SUPER_ADMIN', async () => {
      const mockReq = { admin: { role: 'ADMIN' } } as AuthenticatedRequest;
      
      await expect(controller.hardDelete('123', mockReq)).rejects.toThrow(ForbiddenException);
      expect(service.hardDelete).not.toHaveBeenCalled();
    });

    it('should call hardDelete service if user is SUPER_ADMIN', async () => {
      const mockReq = { admin: { role: 'SUPER_ADMIN' } } as AuthenticatedRequest;
      mockAdminService.hardDelete.mockResolvedValue({ success: true });
      
      await controller.hardDelete('123', mockReq);
      expect(service.hardDelete).toHaveBeenCalledWith('123');
    });
  });
});
