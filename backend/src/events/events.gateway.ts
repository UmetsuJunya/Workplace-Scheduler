import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import {
  ScheduleEventData,
  UserEventData,
  UserDeletedEventData,
  ProjectEventData,
  ProjectDeletedEventData,
  LocationEventData,
  LocationDeletedEventData,
  LocationReorderEventData,
  WebSocketResponse,
} from './interfaces';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Schedule events
  @SubscribeMessage('schedule:create')
  handleScheduleCreate(
    @MessageBody() data: ScheduleEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`Schedule created by ${client.id}`);
    // Broadcast to all clients except sender
    client.broadcast.emit('schedule:created', data);
    return { success: true };
  }

  @SubscribeMessage('schedule:update')
  handleScheduleUpdate(
    @MessageBody() data: ScheduleEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`Schedule updated by ${client.id}`);
    client.broadcast.emit('schedule:updated', data);
    return { success: true };
  }

  @SubscribeMessage('schedule:delete')
  handleScheduleDelete(
    @MessageBody() data: ScheduleEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`Schedule deleted by ${client.id}`);
    client.broadcast.emit('schedule:deleted', data);
    return { success: true };
  }

  // User events
  @SubscribeMessage('user:create')
  handleUserCreate(
    @MessageBody() data: UserEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`User created by ${client.id}`);
    client.broadcast.emit('user:created', data);
    return { success: true };
  }

  @SubscribeMessage('user:update')
  handleUserUpdate(
    @MessageBody() data: UserEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`User updated by ${client.id}`);
    client.broadcast.emit('user:updated', data);
    return { success: true };
  }

  @SubscribeMessage('user:delete')
  handleUserDelete(
    @MessageBody() data: UserDeletedEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`User deleted by ${client.id}`);
    client.broadcast.emit('user:deleted', data);
    return { success: true };
  }

  // Project events
  @SubscribeMessage('project:create')
  handleProjectCreate(
    @MessageBody() data: ProjectEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`Project created by ${client.id}`);
    client.broadcast.emit('project:created', data);
    return { success: true };
  }

  @SubscribeMessage('project:update')
  handleProjectUpdate(
    @MessageBody() data: ProjectEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`Project updated by ${client.id}`);
    client.broadcast.emit('project:updated', data);
    return { success: true };
  }

  @SubscribeMessage('project:delete')
  handleProjectDelete(
    @MessageBody() data: ProjectDeletedEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`Project deleted by ${client.id}`);
    client.broadcast.emit('project:deleted', data);
    return { success: true };
  }

  // Location preset events
  @SubscribeMessage('location:create')
  handleLocationCreate(
    @MessageBody() data: LocationEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`Location preset created by ${client.id}`);
    client.broadcast.emit('location:created', data);
    return { success: true };
  }

  @SubscribeMessage('location:update')
  handleLocationUpdate(
    @MessageBody() data: LocationEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`Location preset updated by ${client.id}`);
    client.broadcast.emit('location:updated', data);
    return { success: true };
  }

  @SubscribeMessage('location:delete')
  handleLocationDelete(
    @MessageBody() data: LocationDeletedEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`Location preset deleted by ${client.id}`);
    client.broadcast.emit('location:deleted', data);
    return { success: true };
  }

  @SubscribeMessage('location:reorder')
  handleLocationReorder(
    @MessageBody() data: LocationReorderEventData,
    @ConnectedSocket() client: Socket,
  ): WebSocketResponse {
    this.logger.log(`Location presets reordered by ${client.id}`);
    client.broadcast.emit('location:reordered', data);
    return { success: true };
  }

  // Helper method to emit events from services
  emitScheduleCreated(data: ScheduleEventData): void {
    this.server.emit('schedule:created', data);
  }

  emitScheduleUpdated(data: ScheduleEventData): void {
    this.server.emit('schedule:updated', data);
  }

  emitScheduleDeleted(data: { id: string }): void {
    this.server.emit('schedule:deleted', data);
  }

  emitUserCreated(data: UserEventData): void {
    this.server.emit('user:created', data);
  }

  emitUserUpdated(data: UserEventData): void {
    this.server.emit('user:updated', data);
  }

  emitUserDeleted(data: UserDeletedEventData): void {
    this.server.emit('user:deleted', data);
  }

  emitProjectCreated(data: ProjectEventData): void {
    this.server.emit('project:created', data);
  }

  emitProjectUpdated(data: ProjectEventData): void {
    this.server.emit('project:updated', data);
  }

  emitProjectDeleted(data: ProjectDeletedEventData): void {
    this.server.emit('project:deleted', data);
  }

  emitLocationCreated(data: LocationEventData): void {
    this.server.emit('location:created', data);
  }

  emitLocationUpdated(data: LocationEventData): void {
    this.server.emit('location:updated', data);
  }

  emitLocationDeleted(data: LocationDeletedEventData): void {
    this.server.emit('location:deleted', data);
  }

  emitLocationReordered(data: LocationReorderEventData): void {
    this.server.emit('location:reordered', data);
  }
}
