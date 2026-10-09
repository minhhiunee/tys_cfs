import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsController } from './submissions.controller.js';
import { SubmissionsService } from './submissions.service.js';

describe('SubmissionsController', () => {
  let controller: SubmissionsController;
  let service: SubmissionsService;

  const mockSubmissionsService = {
    create: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [
        {
          provide: SubmissionsService,
          useValue: mockSubmissionsService,
        },
      ],
    }).compile();

    controller = module.get<SubmissionsController>(SubmissionsController);
    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a submission and return success message', async () => {
      const createDto = { content: 'Test confession', mediaIds: [] };
      const mockResult = { id: 'uuid-123' };
      
      mockSubmissionsService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        message: 'Submission received and is awaiting moderation.',
        id: 'uuid-123',
      });
    });
  });
});
