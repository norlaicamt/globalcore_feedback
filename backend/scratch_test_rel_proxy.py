from sqlalchemy import Column, Integer, String, create_engine, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, Session
from sqlalchemy.ext.associationproxy import association_proxy

Base = declarative_base()

class Entity(Base):
    __tablename__ = 'entity'
    id = Column(Integer, primary_key=True)
    name = Column(String)

class Context(Base):
    __tablename__ = 'context'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    entity_id = Column(Integer, ForeignKey('entity.id'))
    
    user = relationship("User", back_populates="context")
    entity = relationship("Entity")

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    
    context = relationship("Context", back_populates="user", uselist=False)
    
    entity = association_proxy('context', 'entity')
    entity_id = association_proxy('context', 'entity_id')

engine = create_engine('sqlite:///:memory:')
Base.metadata.create_all(engine)

session = Session(engine)
e = Entity(name="Org")
u = User(name="Test")
c = Context(entity=e)
u.context = c
session.add(e)
session.add(u)
session.commit()

# Test property access
assert u.entity.name == "Org"
assert u.entity_id == e.id
print("Relationship proxy works!")
