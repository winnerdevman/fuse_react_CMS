import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { OrganizationEntity, PackageEntity, UserEntity } from '.'

@Entity({ name: 'activation' })
export class ActivationEntity {
  @PrimaryGeneratedColumn('uuid') // Use uuid as activation code
  id: string

  @Column({ nullable: true }) // order or payment reference
  reference: string

  @OneToMany(
    () => OrganizationEntity,
    (organization) => organization.activation,
  )
  organization: OrganizationEntity[]

  @ManyToOne(() => PackageEntity, { nullable: false })
  package: PackageEntity

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity
}
