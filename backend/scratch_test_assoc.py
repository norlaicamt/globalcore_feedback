from sqlalchemy import Column, Integer, String, create_engine, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, Session
from sqlalchemy.ext.associationproxy import association_proxy

Base = declarative_base()

class Profile(Base):
    __tablename__ = 'profile'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    email = Column(String)
    
    user = relationship("User", back_populates="profile")

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    
    profile = relationship("Profile", back_populates="user", uselist=False)
    
    email = association_proxy('profile', 'email')

engine = create_engine('sqlite:///:memory:')
Base.metadata.create_all(engine)

session = Session(engine)
u = User(name="Test")
u.profile = Profile(email="test@test.com")
session.add(u)
session.commit()

# Test property access
assert u.email == "test@test.com"
# Test querying
res = session.query(User).filter(User.email == "test@test.com").first()
print("Query result:", res.name)
