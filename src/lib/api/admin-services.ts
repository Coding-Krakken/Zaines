/**
 * Admin Services API - Server-side helpers for service management
 * Handles reading/writing services (pricing, availability, etc)
 */

import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface ServiceWithType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
  isActive: boolean;
  serviceType: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
  };
}

/**
 * Get all services grouped by service type
 */
export async function getServicesWithTypes(): Promise<{
  serviceTypes: Array<{
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    services: ServiceWithType[];
  }>;
} | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const serviceTypes = await prisma.serviceType.findMany({
      include: {
        services: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      serviceTypes: serviceTypes.map((st) => ({
        id: st.id,
        name: st.name,
        description: st.description,
        icon: st.icon,
        services: st.services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price,
          duration: s.duration,
          isActive: s.isActive,
          serviceType: {
            id: st.id,
            name: st.name,
            description: st.description,
            icon: st.icon,
          },
        })),
      })),
    };
  } catch (error) {
    console.error('Error fetching services with types:', error);
    return null;
  }
}

/**
 * Get a single service by ID
 */
export async function getService(serviceId: string): Promise<ServiceWithType | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        serviceType: true,
      },
    });

    if (!service) return null;

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      isActive: service.isActive,
      serviceType: {
        id: service.serviceType.id,
        name: service.serviceType.name,
        description: service.serviceType.description,
        icon: service.serviceType.icon,
      },
    };
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
}

/**
 * Update service price and/or active status
 */
export async function updateService(
  serviceId: string,
  updates: {
    price?: number;
    isActive?: boolean;
  },
): Promise<ServiceWithType | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const data: Prisma.ServiceUpdateInput = {};

    if (updates.price !== undefined) {
      data.price = updates.price;
    }

    if (updates.isActive !== undefined) {
      data.isActive = updates.isActive;
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data,
      include: {
        serviceType: true,
      },
    });

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      isActive: service.isActive,
      serviceType: {
        id: service.serviceType.id,
        name: service.serviceType.name,
        description: service.serviceType.description,
        icon: service.serviceType.icon,
      },
    };
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
}

/**
 * Update multiple services at once
 */
export async function updateServices(
  updates: Array<{
    id: string;
    price?: number;
    isActive?: boolean;
  }>,
): Promise<ServiceWithType[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const results = await Promise.all(
      updates.map((update) =>
        prisma.service.update({
          where: { id: update.id },
          data: {
            ...(update.price !== undefined && { price: update.price }),
            ...(update.isActive !== undefined && { isActive: update.isActive }),
          },
          include: {
            serviceType: true,
          },
        }),
      ),
    );

    return results.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      isActive: service.isActive,
      serviceType: {
        id: service.serviceType.id,
        name: service.serviceType.name,
        description: service.serviceType.description,
        icon: service.serviceType.icon,
      },
    }));
  } catch (error) {
    console.error('Error updating services:', error);
    throw error;
  }
}
