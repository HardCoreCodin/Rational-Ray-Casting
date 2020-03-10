# Rational Ray Casting

This is a modified version of the one detailed in: 
<b>[Raycasting Basics with JavaScript](https://courses.pikuma.com/courses/raycasting)</b><br>
By: <b>Gustavo Pezzi</b><br>
<br>
This work is meant to be a practical demonstration of how <i>transcendental</i> functions <u>can</u> be avoided completely<br>
 in a computer graphics rendering programs, while at the same time making the code simpler and faster.

This work is inspired by the work of professor <b>Norman J. Wildberger</b> of the <b>University of New South Wales</b><br>
In particular: <i>[WildTrig: Intro to Rational Trigonometry](https://www.youtube.com/watch?v=GGj399xIssQ&list=PL3C58498718451C47)</i><br>

This implementation does <u><b>not</b> make use of <i><b>any</b></i> angles or measures of distances(!)</u><br>
It intentionally avoids <u>any</u> <i>transcendental</i> functions such as:<b>
1. sin()
2. cos()
3. tan()
4. sqrt()</b>

It does <b>not</b> achieve that through traditional means such as substitution with tables or approximation.<br>
Instead, a purely rational approach is taken all throughout. <br>

This implementation relies heavily on the <i>[rational parameterization of the unit circle](https://mathnow.wordpress.com/2009/11/06/a-rational-parameterization-of-the-unit-circle)</i><br>
by projecting 2D position coordinates onto a unit circle to be used as pure directional unit vectors.<br>
These are then used to represent the orientation of the player and the rays,<br>
as well as for constructing 2D rotation matrices for re-orienting them.<br>
<br>
The original implementation had 2 distances computed for the horizontal and vertical hits.<br>
They were <i>positive</i> distance measures which were subsequently used for each ray to:
1. Determine which of the horizontal vs. vertical hits is the closest.
2. Compute the height of each pixel column in the 3D viewport.

The 2 hit distances were computed using the pythagorean theorem (involving a square root).<br>
They were then compared to determine which of the 2 hits is closest.<br>
Given how these distances are always positive, as long as their only use is for comparing them,<br>
their squares can be compared instead, avoiding the square root.<br>
However that was not possible in the original implementation, because these distances were also<br>
used to compute the height of each pixel column: To get at a <i>perpendicular</i> distance for each ray,<br>
a trigonometric <b>cos()</b> function was applied onto the closest distance of the two.<br>
To that end, a square root was needed to be taken to get at that actual closest distance measure.

This alternative implementation represents orientations as 2D unit-vectors, as opposed to angles.<br>
The same <i>perpendicular</i> distance is attained by <i>projecting</i> each ray's vector onto the<br>
player's orientation vector by taking their dot product (a.k.a: Inner Product). <br>
This avoids both the square root and the <b>cos</b> function (both of which are transcendentals).<br>
And given how the only use left for the ray hit point distances is to compare them, <br>
the squares of the distances are used for the comparison instead, avoiding the square root entirely.<br>

The original implementation used the <b>tan()</b> function to get at the horizontal and vertical steps.<br>
That was convenient given how the orientation of the rays was represented as angles.<br>

Given how this alternative implementation represents these orientations as unit vectors,<br>
the same ratio represented by the <b>tan()</b> is attained by a simple division of the vector's components.

Lastly, the original implementation used an angle for the field of view (a.k.a: FOV).<br>
This determines the spread between the origin and the projection plane.<br>
Using an angle to represent this spread is a very common practice in computer graphics programs.<br>
For a given projection plane, changing this angle affects the strength of the perspective distortion.<br>
However, what this angle is invariably used for is just for getting at a certain <i>ratio</i>:<br>
In a pin-hole camera model, the distance of the pin-hole to the projection plane is the <i>focal length</i>.<br>
The <i>ratio</i> between this focal length and (half-of)the width of the projection plane,<br>
is the <i>actual</i> factor that determines the spread (the strength of the perspective distortion)<br>
This <i>ratio</i> (which can be termed the FOV-ratio) can be changed by changing either<br>
the focal length or the width of the projection plane. An FOV angle is just one way to represent this ratio,<br>
independently from the actual mesurements of the focal length and projection plane width. 

This alternative implementation avoid using an FOV-angle, by having the focal length as the input instead.<br>
A normalized coordinate system for the projection plane would have it set with a width of 2 (-1 to 1).<br>
A focal length of 1 in such a case would yield an FOV-ratio of 1:1, since half of the width of 2 is 1.<br> 
This would be equivalent to a field of view angle of 90 degrees (or a half-angle of 45 degrees).<br>
Given such a projection plane of fixed size, the focal length is inversely proportional to the strength<br>
of the perspective distortion, such that a longer focal length is equivalent to a narrower field of view.<br>
The FOV-ratio can thus be computed very simply by dividing half of the width (1) by the focal length.<br>

In this implementation ray directions are produced using the parametric form of the unit circle.<br>
However this requires a focal length of 1. When the focal length is defined as a number other than 1,<br>
the projection plane could instead be scaled by an inverse amount to complensate.<br>
This maintains the same FOV-ratio (perspective sterngth), while keeping the focal length at 1.<br>
It is a very common practice for perspective projection in graphics APIs (such as OpenGL or Direct3D).<br>